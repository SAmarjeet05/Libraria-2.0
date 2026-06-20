from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from enum import Enum as PyEnum
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text
import os
import json
import re

from app.core.database import get_db, engine
from app.models.system_log import SystemLog, ActorType

router = APIRouter(prefix="/ai", tags=["ai"])

# Preferred local ollama model. Can be overridden with env var `OLLAMA_CLI_MODEL`.
# Keep same fallback names as other modules so the app uses a single configured model.
PREFERRED_OLLAMA_MODEL = os.getenv('OLLAMA_CLI_MODEL') or os.getenv('LLAMA_CLI_MODEL') or os.getenv('LLAMA_MODEL') or 'llama3:8b'


class RequestActor(str, PyEnum):
    user = "user"
    admin = "admin"


class AIQueryIn(BaseModel):
    # Accept either 'text' or 'query' keys from clients for flexibility
    text: Optional[str] = None
    query: Optional[str] = None
    actor_type: RequestActor = RequestActor.user
    actor_id: Optional[str] = None


class AILogIn(BaseModel):
    action_type: str
    query: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    actor_type: RequestActor = RequestActor.user
    actor_id: Optional[str] = None


def load_schema_description():
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'schema_description_library.json'))
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def call_llama(prompt: str) -> Optional[str]:
    """Call an external Llama-like service if configured via LLAMA_API_URL env var.
    The service is expected to return JSON with a 'sql' field or plain text SQL.
    """
    # Prefer remote LLAMA_API_URL if provided (keeps backward compatibility)
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
            # surface a clear message to help debugging remote calls
            raise HTTPException(status_code=502, detail=f"LLAMA_API_URL request failed: {e}")

    # If no remote API, use local Ollama runtime via `ollama run <model>`.
    # We pass the prompt through stdin to the process.
    try:
        import subprocess
        # On Windows the default encoding may be cp1252 which can raise UnicodeDecodeError
        # when reading binary output from the subprocess. Force UTF-8 decoding and replace
        # invalid characters to avoid crashing the reader thread.
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
            # If Ollama CLI not found, FileNotFoundError would be raised instead
            raise HTTPException(status_code=502, detail=f"Local ollama run failed: {stderr}")
        out = (proc.stdout or '').strip()
        # Try parsing JSON output if any
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


def call_llama_model(prompt: str, model: str | None = None, max_tokens: int = 512) -> Optional[str]:
    """Call a specific Llama model. If `LLAMA_API_URL` is configured the request will include
    the model name when provided. Otherwise calls the local `ollama run <model>` CLI.
    """
    url = os.getenv('LLAMA_API_URL')
    if url:
        try:
            import requests
            payload = {'prompt': prompt, 'max_tokens': max_tokens}
            if model:
                payload['model'] = model
            res = requests.post(url, json=payload, timeout=30)
            if not res.ok:
                raise HTTPException(status_code=502, detail=f"LLama service returned status {res.status_code}")
            try:
                j = res.json()
                return j.get('text') or j.get('result') or res.text
            except Exception:
                return res.text
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"LLAMA_API_URL request failed: {e}")

    try:
        import subprocess
        # Use provided model or fallback to the preferred configured model
        cli_model = model or PREFERRED_OLLAMA_MODEL
        proc = subprocess.run(
            ['ollama', 'run', cli_model],
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
            return j.get('text') or j.get('result') or out
        except Exception:
            return out
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Neither LLAMA_API_URL is set nor 'ollama' CLI found. Install Ollama or ensure 'ollama' is on PATH.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Local ollama invocation failed: {e}")


def sanitize_model_sql(text: str) -> str:
    """Strip common markdown/code fences and return the inner SQL/text.
    Examples:
    ```sql\nSELECT ...\n```
    or ```\nSELECT ...\n```
    Also trims surrounding whitespace and backticks.
    """
    if not text:
        return ''
    s = str(text)
    # remove surrounding triple-backtick blocks and capture inner content
    m = re.search(r'```(?:sql)?\s*([\s\S]*?)```', s, flags=re.IGNORECASE)
    if m:
        s = m.group(1)
    # remove any single-line fences like `SELECT ...`
    s = s.strip()
    if s.startswith('`') and s.endswith('`'):
        s = s.strip('`').strip()
    # If the model included explanatory text before the SQL (e.g. "Here is the SQL statement:"),
    # extract the first SQL statement starting at a known SQL verb.
    m2 = re.search(r'(?i)\b(select|insert|update|delete)\b', s)
    if m2:
        s = s[m2.start():].strip()
    return s


def normalize_case_insensitive(sql: str) -> str:
    """Fix common incorrect case-insensitive patterns produced by the model.
    Examples:
      name = LOWER('foo')  -> LOWER(name) = LOWER('foo')
    This is a best-effort fix so queries match regardless of case.
    """
    if not sql:
        return sql
    s = str(sql)
    # replace patterns like "col = LOWER('val')" with "LOWER(col) = LOWER('val')"
    s = re.sub(r"\b([a-zA-Z_][a-zA-Z0-9_]*)\b\s*=\s*LOWER\(\s*('[^']*')\s*\)", r"LOWER(\1) = LOWER(\2)", s)
    return s


def enforce_case_insensitive(sql: str) -> str:
    """Ensure string comparisons and LIKE use case-insensitive matching.
    - col = 'value' -> col COLLATE NOCASE = 'value' (unless LOWER(...) or COLLATE already used)
    - col LIKE 'pattern' -> col COLLATE NOCASE LIKE 'pattern'
    Leaves numeric comparisons (e.g., = 0) untouched.
    This is a best-effort text transform using regex.
    """
    if not sql:
        return sql
    s = str(sql)
    # Handle LIKE (avoid modifying when COLLATE already used)
    s = re.sub(r"(?i)\b([a-zA-Z_][a-zA-Z0-9_\.]*)\b\s+(?!COLLATE)LIKE\s+('[^']*')", r"\1 COLLATE NOCASE LIKE \2", s)
    # Handle equality with string literal: col = 'val' -> col COLLATE NOCASE = 'val'
    # Avoid changing when RHS is a function call or when COLLATE/LOWER already present
    s = re.sub(r"(?i)\b([a-zA-Z_][a-zA-Z0-9_\.]*)\b\s*=\s*('(?:[^']*)')", r"\1 COLLATE NOCASE = \2", s)
    return s


def verify_sql(sql: str) -> bool:
    s = (sql or '').strip()
    if not s:
        return False
    ls = s.lower()
    # locate the first SQL verb in case the model prepended explanation text
    m = re.search(r'(?i)\b(select|insert|update|delete)\b', s)
    if not m:
        return False
    s_core = s[m.start():].strip()
    ls_core = s_core.lower()
    # basic safety: allow only select/insert/update/delete
    allowed = ls_core.startswith('select') or ls_core.startswith('insert') or ls_core.startswith('update') or ls_core.startswith('delete')
    if not allowed:
        return False
    # only allow a single statement (at most one semicolon terminating the statement)
    if ';' in ls_core and ls_core.count(';') > 1:
        return False
    # disallow dangerous keywords anywhere in the core SQL
    for bad in ['drop ', 'alter ', 'attach ', 'detach ', 'pragma ', 'vacuum ', 'transaction']:
        if bad in ls_core:
            return False
    return True


@router.post('/query')
def ai_query(payload: AIQueryIn, db: Session = Depends(get_db)):
    schema = load_schema_description()
    user_text = (payload.text or payload.query or "").strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Missing 'text' in request body. Send JSON like {\"text\": \"Show all available books by Dan Brown\"}.")

    # Only admins may use the query endpoint (per project policy)
    if payload.actor_type != RequestActor.admin:
        raise HTTPException(status_code=403, detail='The /ai/query endpoint is restricted to admin users only.')

    # Instruct the model to prefer case-insensitive matching for text fields (use COLLATE NOCASE or LOWER()).
    prompt = (
        f"You are an AI SQL assistant for a library system. Schema: {json.dumps(schema)}\n"
        f"When matching text fields prefer case-insensitive comparisons (use COLLATE NOCASE or LOWER(column)=LOWER(value)).\n"
        f"Convert the user's request into a valid SQLite SQL statement.\nUser request: {user_text}\nReturn only the SQL statement."
    )

    # Use Llama for NL->SQL conversion. call_llama will raise if LLAMA_API_URL is not configured
    raw_sql = call_llama(prompt)
    if not raw_sql:
        raise HTTPException(status_code=502, detail="LLama did not return a SQL string; check LLAMA service response")

    # sanitize model output (strip markdown fences, code blocks, etc.)
    sql = sanitize_model_sql(raw_sql)
    # normalize common case-insensitive errors (model sometimes emits `name = LOWER('x')`)
    sql = normalize_case_insensitive(sql)

    # basic verification
    if not verify_sql(sql):
        # persist a log entry so we can inspect what the model produced
        try:
            log = SystemLog(actor_type=ActorType.AI,
                            actor_id=payload.actor_id,
                            action=user_text,
                            ai_response=str(raw_sql),
                            success=False)
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
        # include the generated SQL (truncated) in the error detail to aid debugging
        snippet = (str(sql)[:1000] + '...') if len(str(sql)) > 1000 else str(sql)
        raise HTTPException(status_code=400, detail=f"Generated SQL failed verification or contains disallowed statements. Generated SQL: {snippet}")

    # Execute SQL with a small fallback strategy for SELECTs that return zero rows:
    # 1) try the original SQL
    # 2) if SELECT and zero rows, retry with enforce_case_insensitive(sql)
    # 3) if still zero and a status='available' predicate exists, try removing that predicate and retry
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

            # Attempt 1: original
            try:
                res1 = run_sql(sql)
                attempts.append({'sql': sql, 'result': res1})
                if isinstance(res1, dict) and res1.get('rows') is not None and len(res1.get('rows', [])) > 0:
                    final_result = res1
                elif isinstance(res1, dict) and 'rowcount' in res1 and res1.get('rowcount') is not None:
                    final_result = res1
            except Exception as e:
                attempts.append({'sql': sql, 'error': str(e)})

            # If no rows returned for a SELECT, try case-insensitive rewrite
            if final_result is None and sql.strip().lower().startswith('select'):
                try:
                    ci_sql = enforce_case_insensitive(sql)
                    if ci_sql != sql:
                        res2 = run_sql(ci_sql)
                        attempts.append({'sql': ci_sql, 'result': res2})
                        if isinstance(res2, dict) and res2.get('rows') is not None and len(res2.get('rows', [])) > 0:
                            final_result = res2
                            final_sql_used = ci_sql
                except Exception as e:
                    attempts.append({'sql': ci_sql, 'error': str(e)})

            # If still no rows and query mentions status = 'available', try removing that predicate and retry
            if final_result is None and sql.strip().lower().startswith('select'):
                if re.search(r"(?i)status\s*=\s*'available'", sql):
                    try:
                        removed_sql = re.sub(r"(?i)\bAND\s+status\s*=\s*'available'", '', sql)
                        removed_sql = re.sub(r"(?i)status\s*=\s*'available'\s+AND", '', removed_sql)
                        removed_sql = removed_sql
                        res3 = run_sql(removed_sql)
                        attempts.append({'sql': removed_sql, 'result': res3})
                        if isinstance(res3, dict) and res3.get('rows') is not None and len(res3.get('rows', [])) > 0:
                            final_result = res3
                            final_sql_used = removed_sql
                    except Exception as e:
                        attempts.append({'sql': removed_sql if 'removed_sql' in locals() else '', 'error': str(e)})

        # Prepare execution_result JSON including attempts for debugging
        import json as _json
        exec_json = None
        try:
            exec_json = _json.dumps({'attempts': attempts}, default=str)
        except Exception:
            exec_json = None

        # Log into logs table (store raw AI response and execution result JSON)
        try:
            actor = ActorType.ADMIN if (payload.actor_type and str(payload.actor_type).lower() == 'admin') else ActorType.USER
            log = SystemLog(actor_type=actor,
                            actor_id=payload.actor_id,
                            action=user_text,
                            ai_response=str(raw_sql),
                            execution_result=exec_json,
                            success=True)
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()

        # If we never got a final_result, return the last attempt's error or an empty result
        if final_result is None:
            # choose the last successful-looking attempt if any
            if attempts:
                last = attempts[-1]
                if 'result' in last:
                    final_result = last.get('result')
                else:
                    # surface an execution error
                    raise HTTPException(status_code=500, detail=f"SQL execution attempts failed. Last attempt: {last.get('error')}")
            else:
                raise HTTPException(status_code=500, detail='SQL execution produced no result')

        return { 'sql': final_sql_used, 'result': final_result }
    except Exception as e:
        # Log failure
        try:
            import json as _json
            err_json = _json.dumps({'error': str(e)})
            log = SystemLog(actor_type=ActorType.AI,
                            actor_id=payload.actor_id,
                            action=payload.text,
                            ai_response=str(raw_sql),
                            execution_result=err_json,
                            success=False)
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(status_code=500, detail=f"SQL execution error: {e}")


@router.post('/summarize')
def ai_summarize(book_id: int, db: Session = Depends(get_db)):
    # fetch book
    from app.models.book import Book
    b = db.query(Book).filter(Book.id == book_id).first()
    if not b:
        raise HTTPException(status_code=404, detail='Book not found')

    # Use Llama for summarization. Llama is required.
    prompt = (
        f"You are a helpful assistant that summarizes books for end users. Schema: {json.dumps(load_schema_description())}\n"
        f"Summarize the following book in 2-3 concise sentences for a reader considering whether to borrow it.\nTitle: {b.title}\nAuthor: {b.author}\nDescription: {b.description or ''}\n"
    )
    text = call_llama(prompt)
    if not text:
        raise HTTPException(status_code=502, detail='LLama did not return a summary')

    # log
    try:
        log = SystemLog(actor_type=ActorType.AI, action=f"summarize:{book_id}", ai_response=None, success=True)
        db.add(log); db.commit()
    except Exception:
        db.rollback()

    return { 'summary': text }


@router.get('/welcome')
def ai_welcome():
    """Generate a short inspirational quote for the library landing/welcome page using the local Llama model or remote LLAMA_API_URL.
    Returns JSON: { quote: string }
    """
    prompt = (
        "You are a friendly assistant that writes short inspirational quotes about studying, learning, and libraries. "
        "Return a single concise uplifting sentence (1-2 sentences) suitable for a library landing page."
    )
    try:
        text = call_llama(prompt)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate welcome quote: {e}")

    if not text:
        raise HTTPException(status_code=502, detail='LLama did not return a welcome quote')

    # sanitize and return
    quote = str(text).strip()
    return { 'quote': quote }


@router.post('/recommend')
def ai_recommend(book_id: int = None, db: Session = Depends(get_db)):
    # Recommend books similar to a given book (book_id required)
    if not book_id:
        raise HTTPException(status_code=400, detail='book_id is required')

    from app.models.book import Book
    b = db.query(Book).filter(Book.id == book_id).first()
    if not b:
        raise HTTPException(status_code=404, detail='Book not found')

    prompt = (
        f"You are an AI recommendation engine that recommends similar books from the library database. "
        f"Schema: {json.dumps(load_schema_description())}\n"
        f"Given the following book, return a JSON array (only) of up to 5 recommended book titles available in the library that a user would likely enjoy: \nTitle: {b.title}\nAuthor: {b.author}\nDescription: {b.description or ''}\n"
    )
    text = call_llama(prompt)
    if not text:
        raise HTTPException(status_code=502, detail='LLama did not return recommendations')

    # log
    try:
        log = SystemLog(actor_type=ActorType.AI, action=f"recommend:{book_id}", ai_response=None, success=True)
        db.add(log); db.commit()
    except Exception:
        db.rollback()

    # attempt to parse JSON
    try:
        parsed = json.loads(text)
    except Exception:
        parsed = [text]

    return { 'recommendations': parsed }


class RecommendByUserIn(BaseModel):
    user_id: str
    max_results: Optional[int] = 5


@router.post('/recommend_by_user')
def ai_recommend_by_user(payload: RecommendByUserIn, db: Session = Depends(get_db)):
    # Build a prompt using recent borrow records and user preferences
    user_id = payload.user_id
    from app.models.user import User
    from app.models.borrow_record import BorrowRecord
    from app.models.book import Book

    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail='User not found')

    recent = db.query(BorrowRecord).filter(BorrowRecord.user_id == user_id).order_by(BorrowRecord.borrowed_at.desc()).limit(10).all()
    recent_titles = []
    for r in recent:
        b = db.query(Book).filter(Book.id == r.book_id).first()
        if b:
            recent_titles.append(b.title)

    prompt = (
        f"Recommend up to {payload.max_results} books from the library for this user based on their recent borrows and preferences. Schema: {json.dumps(load_schema_description())}\n"
        f"User: {u.username} (id: {user_id}), recent borrows: {recent_titles}. \nReturn a JSON array of book titles available in the library." 
    )
    text = call_llama(prompt)
    if not text:
        raise HTTPException(status_code=502, detail='LLama did not return recommendations')

    try:
        parsed = json.loads(text)
    except Exception:
        parsed = [text]

    try:
        log = SystemLog(actor_type=ActorType.AI, action=f"recommend_by_user:{user_id}", ai_response=None, success=True)
        db.add(log); db.commit()
    except Exception:
        db.rollback()

    return { 'recommendations': parsed }


@router.post('/log')
def write_log(payload: AILogIn, db: Session = Depends(get_db)):
    try:
        actor = ActorType.ADMIN if (payload.actor_type and str(payload.actor_type).lower() == 'admin') else ActorType.USER
        log = SystemLog(actor_type=actor, actor_id=payload.actor_id, action=payload.action_type, ai_response=payload.query)
        db.add(log)
        db.commit()
        return { 'status': 'ok', 'id': log.id }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/clear_logs')
def clear_logs(payload: AILogIn, db: Session = Depends(get_db)):
    """Delete all entries in the SystemLog table. Restricted to admin actor_type."""
    # Only allow admin to clear logs
    if payload.actor_type != RequestActor.admin:
        raise HTTPException(status_code=403, detail='Only admin may clear logs')
    try:
        # Use ORM delete
        deleted = db.query(SystemLog).delete()
        db.commit()
        return {'status': 'ok', 'deleted': deleted}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/logs')
def get_logs(limit: int = 200, db: Session = Depends(get_db)):
    """Return recent system logs (most recent first)."""
    try:
        q = db.query(SystemLog).order_by(SystemLog.executed_at.desc()).limit(limit).all()
        return [r.to_dict() for r in q]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/upload_cloudinary')
def upload_cloudinary(file: bytes = None):
    """Accept raw bytes in the request body (client should send the file contents) and upload to Cloudinary if configured."""
    # Expect CLOUDINARY_UPLOAD_URL env var (e.g., 'https://api.cloudinary.com/v1_1/<cloud>/auto/upload') and preset
    url = os.getenv('CLOUDINARY_UPLOAD_URL')
    preset = os.getenv('CLOUDINARY_UPLOAD_PRESET')
    if not url or not preset:
        raise HTTPException(status_code=500, detail='Cloudinary not configured')
    try:
        import requests
        files = {'file': file}
        data = {'upload_preset': preset}
        res = requests.post(url, files=files, data=data, timeout=30)
        if not res.ok:
            raise HTTPException(status_code=500, detail='Cloudinary upload failed')
        j = res.json()
        return {'url': j.get('secure_url')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
