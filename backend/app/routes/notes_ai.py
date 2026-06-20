from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict
from enum import Enum as PyEnum
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text
import os
import json
import re

from app.core.database import get_db, engine
from app.models.system_log import SystemLog, ActorType
from app.models.notes_ai_log import NotesAILog
import time

router = APIRouter(prefix="/notes/ai", tags=["notes_ai"])

# Preferred local ollama model. Can be overridden with env var `OLLAMA_CLI_MODEL`.
PREFERRED_OLLAMA_MODEL = os.getenv('OLLAMA_CLI_MODEL') or os.getenv('LLAMA_CLI_MODEL') or os.getenv('LLAMA_MODEL') or 'llama3:8b'


class RequestActor(str, PyEnum):
    user = "user"
    admin = "admin"


class AIQueryIn(BaseModel):
    text: Optional[str] = None
    query: Optional[str] = None
    actor_type: RequestActor = RequestActor.user
    actor_id: Optional[str] = None
    previous_message: Optional[str] = None


class AILogIn(BaseModel):
    action_type: str
    query: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    actor_type: RequestActor = RequestActor.user
    actor_id: Optional[str] = None


def load_schema_description():
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'schema_description_notes.json'))
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


# reuse llama helpers (simplified copies)

def call_llama(prompt: str) -> Optional[str]:
    url = os.getenv('LLAMA_API_URL')
    if url:
        try:
            import requests
            res = requests.post(url, json={'prompt': prompt, 'max_tokens': 512}, timeout=20)
            if not res.ok:
                raise HTTPException(status_code=502, detail=f"LLama service returned status {res.status_code}")
            try:
                j = res.json()
                return j.get('sql') or j.get('text') or j.get('result') or res.text
            except Exception:
                return res.text
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"LLAMA_API_URL request failed: {e}")

    try:
        import subprocess
        proc = subprocess.run(
            ['ollama', 'run', PREFERRED_OLLAMA_MODEL],
            input=prompt,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=120
        )
        if proc.returncode != 0:
            stderr = (proc.stderr or '').strip()
            raise HTTPException(status_code=502, detail=f"Local ollama run failed: {stderr}")
        out = (proc.stdout or '').strip()
        try:
            j = json.loads(out)
            return j.get('sql') or j.get('text') or j.get('result') or out
        except Exception:
            return out
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Neither LLAMA_API_URL is set nor 'ollama' CLI found. Install Ollama or ensure 'ollama' is on PATH.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Local ollama invocation failed: {e}")


def sanitize_model_sql(text: str) -> str:
    if not text:
        return ''
    s = str(text)
    m = re.search(r'```(?:sql)?\s*([\s\S]*?)```', s, flags=re.IGNORECASE)
    if m:
        s = m.group(1)
    s = s.strip()
    if s.startswith('`') and s.endswith('`'):
        s = s.strip('`').strip()
    m2 = re.search(r'(?i)\b(select|insert|update|delete)\b', s)
    if m2:
        s = s[m2.start():].strip()
    return s


def verify_sql(sql: str) -> bool:
    s = (sql or '').strip()
    if not s:
        return False
    m = re.search(r'(?i)\b(select|insert|update|delete)\b', s)
    if not m:
        return False
    s_core = s[m.start():].strip()
    ls_core = s_core.lower()
    allowed = ls_core.startswith('select') or ls_core.startswith('insert') or ls_core.startswith('update') or ls_core.startswith('delete')
    if not allowed:
        return False
    if ';' in ls_core and ls_core.count(';') > 1:
        return False
    for bad in ['drop ', 'alter ', 'attach ', 'detach ', 'pragma ', 'vacuum ', 'transaction']:
        if bad in ls_core:
            return False
    return True


@router.post('/query')
def notes_ai_query(payload: AIQueryIn, db: Session = Depends(get_db)):
    schema = load_schema_description()
    user_text = (payload.text or payload.query or "").strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Missing 'text' in request body.")

    # Restrict to admin
    if payload.actor_type != RequestActor.admin:
        raise HTTPException(status_code=403, detail='The /notes/ai/query endpoint is restricted to admin users only.')

    prompt = (
        f"You are an AI SQL assistant for the notes system. Schema: {json.dumps(schema)}\n"
        f"When matching text fields prefer case-insensitive comparisons (use COLLATE NOCASE or LOWER(column)=LOWER(value)).\n"
        f"Convert the user's request into a valid SQLite SQL statement.\n"
    )

    # If a previous message is provided in the payload, or if there is a recent log
    # for this same user, provide it as context so the model can maintain continuity.
    prev_ctx = ''
    try:
        if payload.previous_message:
            prev_ctx = f"Previous user message: {payload.previous_message}\n"
        else:
            # Attempt to fetch the most recent log for this user and include it
            if payload.actor_id is not None:
                try:
                    last = db.query(NotesAILog).filter(NotesAILog.user_id == payload.actor_id).order_by(NotesAILog.created_at.desc()).first()
                    if last is not None:
                        last_user_input = getattr(last, 'user_input', None)
                        last_raw = getattr(last, 'raw_output', None)
                        last_model_output = None
                        if last_raw:
                            try:
                                j = json.loads(last_raw)
                                last_model_output = j.get('model_output') or j.get('summary') or j.get('quote') or None
                            except Exception:
                                last_model_output = str(last_raw)
                        if last_user_input or last_model_output:
                            prev_lines = []
                            if last_user_input:
                                prev_lines.append(f"User: {last_user_input}")
                            if last_model_output:
                                prev_lines.append(f"Assistant: {last_model_output}")
                            prev_ctx = "Previous interaction:\n" + "\n".join(prev_lines) + "\n"
                except Exception:
                    # ignore DB lookup errors — we still proceed without prior context
                    prev_ctx = ''
    except Exception:
        prev_ctx = ''

    # attach previous context (if any) to the user-facing prompt
    if prev_ctx:
        prompt = prompt + "\n" + prev_ctx + f"User request: {user_text}\nReturn only the SQL statement."
    else:
        prompt = prompt + f"User request: {user_text}\nReturn only the SQL statement."

    start_t = time.time()
    raw_sql = call_llama(prompt)
    if not raw_sql:
        raise HTTPException(status_code=502, detail="LLama did not return a SQL string")

    sql = sanitize_model_sql(raw_sql)

    if not verify_sql(sql):
        # store prompt and model output in notes_ai_logs for debugging
        try:
            raw_blob = {'prompt': prompt, 'model_output': str(raw_sql), 'sanitized_sql': str(sql)}
            nal = NotesAILog(user_id=payload.actor_id, operation='nl_to_sql', response_time=(time.time() - start_t), status='failed', raw_output=json.dumps(raw_blob, default=str), execution_result=None, user_input=user_text)
            db.add(nal)
            db.commit()
        except Exception:
            db.rollback()
        try:
            log = SystemLog(actor_type=ActorType.AI, actor_id=payload.actor_id, action=user_text, ai_response=str(raw_sql), success=False)
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
        snippet = (str(sql)[:1000] + '...') if len(str(sql)) > 1000 else str(sql)
        raise HTTPException(status_code=400, detail=f"Generated SQL failed verification. Generated SQL: {snippet}")

    try:
        attempts = []
        final_result = None
        final_sql_used = sql
        with engine.connect() as conn:
            def run_sql(sq: str):
                r = conn.execute(sql_text(sq))
                if r.returns_rows:
                    cols = list(r.keys())
                    fetched = r.fetchall()
                    rows = [list(rr) for rr in fetched]
                    return {'columns': cols, 'rows': rows}
                else:
                    conn.commit()
                    return {'rowcount': r.rowcount}

            try:
                res1 = run_sql(sql)
                attempts.append({'sql': sql, 'result': res1})
                if isinstance(res1, dict) and res1.get('rows') is not None and len(res1.get('rows', [])) > 0:
                    final_result = res1
                elif isinstance(res1, dict) and 'rowcount' in res1 and res1.get('rowcount') is not None:
                    final_result = res1
            except Exception as e:
                attempts.append({'sql': sql, 'error': str(e)})

        import json as _json
        exec_json = None
        try:
            exec_json = _json.dumps({'attempts': attempts}, default=str)
        except Exception:
            exec_json = None

        try:
            # save into notes_ai_logs
            try:
                raw_blob = {'prompt': prompt, 'model_output': str(raw_sql), 'execution_attempts': attempts}
                nal = NotesAILog(user_id=payload.actor_id, operation='nl_to_sql', response_time=(time.time() - start_t), status='success', raw_output=json.dumps(raw_blob, default=str), execution_result=exec_json, user_input=user_text)
                db.add(nal)
                db.commit()
            except Exception:
                db.rollback()

            actor = ActorType.ADMIN if (payload.actor_type and str(payload.actor_type).lower() == 'admin') else ActorType.USER
            log = SystemLog(actor_type=actor, actor_id=payload.actor_id, action=user_text, ai_response=str(raw_sql), execution_result=exec_json, success=True)
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()

        if final_result is None:
            if attempts:
                last = attempts[-1]
                if 'result' in last:
                    final_result = last.get('result')
                else:
                    raise HTTPException(status_code=500, detail=f"SQL execution attempts failed. Last attempt: {last.get('error')}")
            else:
                raise HTTPException(status_code=500, detail='SQL execution produced no result')

        return { 'sql': final_sql_used, 'result': final_result }
    except Exception as e:
        # save failure to notes_ai_logs
        try:
            raw_blob = {'prompt': prompt, 'model_output': str(raw_sql), 'error': str(e)}
            nal = NotesAILog(user_id=payload.actor_id, operation='nl_to_sql', response_time=(time.time() - start_t), status='error', raw_output=json.dumps(raw_blob, default=str), execution_result=err_json if 'err_json' in locals() else None, user_input=user_text)
            db.add(nal)
            db.commit()
        except Exception:
            db.rollback()
        try:
            import json as _json
            err_json = _json.dumps({'error': str(e)})
            log = SystemLog(actor_type=ActorType.AI, actor_id=payload.actor_id, action=payload.text, ai_response=str(raw_sql), execution_result=err_json, success=False)
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(status_code=500, detail=f"SQL execution error: {e}")


@router.post('/summarize')
def notes_ai_summarize(note_id: int, db: Session = Depends(get_db)):
    from app.models.notes import Note
    n = db.query(Note).filter(Note.id == note_id).first()
    if not n:
        raise HTTPException(status_code=404, detail='Note not found')

    prompt = (
        f"You are a helpful assistant that summarizes study notes for students. Schema: {json.dumps(load_schema_description())}\n"
        f"Summarize the following note in 2-3 concise sentences for a student considering whether to download it.\nTitle: {n.title}\nDescription: {n.description or ''}\nSubject: {n.subject or ''}\n"
    )
    start_t = time.time()
    text = call_llama(prompt)
    if not text:
        raise HTTPException(status_code=502, detail='LLama did not return a summary')

    # record in notes_ai_logs
    try:
        raw_blob = {'prompt': prompt, 'summary': str(text)}
        # summarize endpoint does not receive actor info; store user_id as None
        nal = NotesAILog(user_id=None, operation='summarize', response_time=(time.time() - start_t), status='success', raw_output=json.dumps(raw_blob, default=str), user_input=f"summarize_note:{note_id}")
        db.add(nal); db.commit()
    except Exception:
        db.rollback()

    try:
        log = SystemLog(actor_type=ActorType.AI, action=f"summarize_note:{note_id}", ai_response=None, success=True)
        db.add(log); db.commit()
    except Exception:
        db.rollback()

    return { 'summary': text }


@router.get('/welcome')
def notes_ai_welcome():
    prompt = (
        "You are a friendly assistant that writes short inspirational quotes about studying and note-sharing. Return a single concise uplifting sentence."
    )
    start_t = time.time()
    try:
        text = call_llama(prompt)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate welcome quote: {e}")

    if not text:
        raise HTTPException(status_code=502, detail='LLama did not return a welcome quote')

    quote = str(text).strip()
    # log the prompt and response into notes_ai_logs (best-effort)
    try:
        raw_blob = {'prompt': prompt, 'quote': quote}
        nal = NotesAILog(user_id=None, operation='welcome', response_time=(time.time() - start_t), status='success', raw_output=json.dumps(raw_blob, default=str), user_input=None)
        db = None
        # try to get a DB session if available
        try:
            from app.core.database import get_db as _get_db
            # create a new session
            from sqlalchemy.orm import Session
            # the routing functions normally receive db via Depends; here we'll try a lightweight approach
        except Exception:
            _get_db = None
        try:
            # attempt to write using a fresh session if possible
            if _get_db:
                s = next(_get_db())
                s.add(nal)
                s.commit()
                s.close()
        except Exception:
            try:
                # fallback: do nothing if we couldn't persist
                pass
            except Exception:
                pass
    except Exception:
        pass

    return { 'quote': quote }


@router.post('/log')
def notes_write_log(payload: AILogIn, db: Session = Depends(get_db)):
    try:
        actor = ActorType.ADMIN if (payload.actor_type and str(payload.actor_type).lower() == 'admin') else ActorType.USER
        log = SystemLog(actor_type=actor, actor_id=payload.actor_id, action=payload.action_type, ai_response=payload.query)
        db.add(log)
        db.commit()
        return { 'status': 'ok', 'id': log.id }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/logs')
def get_notes_ai_logs(limit: int = 200, actor_type: RequestActor = RequestActor.user, actor_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Return recent notes AI logs (admin only). Adds parsed JSON fields for convenience."""
    # restrict to admin (project-level policy)
    if actor_type != RequestActor.admin:
        raise HTTPException(status_code=403, detail='Only admin may view notes AI logs')
    try:
        # If actor_id is provided, restrict results to that admin's logs only
        if actor_id is not None:
            q = db.query(NotesAILog).filter(NotesAILog.user_id == actor_id).order_by(NotesAILog.created_at.desc()).limit(limit).all()
        else:
            q = db.query(NotesAILog).order_by(NotesAILog.created_at.desc()).limit(limit).all()
        out = []
        for r in q:
            # Build a plain dict from the ORM object to avoid any unexpected method collisions
            item = {}
            try:
                for c in r.__table__.columns:
                    val = getattr(r, c.name)
                    # stringify datetimes and UUIDs similar to BaseModel.dict
                    try:
                        import datetime
                        if isinstance(val, (datetime.datetime, datetime.date)):
                            val = val.isoformat()
                    except Exception:
                        pass
                    try:
                        import uuid
                        if isinstance(val, uuid.UUID):
                            val = str(val)
                    except Exception:
                        pass
                    item[c.name] = val
            except Exception:
                # fallback: try to call r.dict() if available
                try:
                    item = r.dict()
                except Exception:
                    item = { 'id': getattr(r, 'id', None) }

            # try to parse raw_output and execution_result for convenience
            try:
                raw_text = item.get('raw_output') if item.get('raw_output') is not None else '{}'
                item['raw_output_json'] = json.loads(raw_text)
            except Exception:
                item['raw_output_json'] = None
            try:
                exec_text = item.get('execution_result')
                item['execution_result_json'] = json.loads(exec_text) if exec_text else None
            except Exception:
                item['execution_result_json'] = None
            out.append(item)
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
