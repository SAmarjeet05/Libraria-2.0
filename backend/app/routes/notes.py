from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Body, Header, Request
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse, StreamingResponse, Response
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from mega import Mega
import httpx
import aiofiles
import uuid
from datetime import datetime, timedelta

from app.core.database import get_db
from app.schemas.notes import NoteCreate, NoteOut
from app.crud.crud_notes import create_note, update_note_ai_fields
from app.crud.crud_notes_access_log import create_notes_access_log
from app.models.notes_report import NotesReport
from app.crud.crud_notes_report import create_notes_report
from app.models.notes import Note
from app.models.notes_access_log import NotesAccessLog
from app.routes.ai import call_llama, call_llama_model
import subprocess
from app.routes.auth import get_current_user
from app.crud import crud_user


import requests
import json
import os
import pathlib
import logging
import subprocess
import shutil
import tempfile
import re
import threading

router = APIRouter(prefix="/notes", tags=["notes"])
logger = logging.getLogger(__name__)

# Preferred local ollama model. Can be overridden with env var `OLLAMA_CLI_MODEL`.
PREFERRED_OLLAMA_MODEL = os.getenv('OLLAMA_CLI_MODEL') or os.getenv('LLAMA_CLI_MODEL') or os.getenv('LLAMA_MODEL') or 'llama3:8b'


# Load .env
try:
    from dotenv import load_dotenv
    project_root = pathlib.Path(__file__).resolve().parents[2]
    load_dotenv(project_root / ".env")
except:
    pass


MEGA_EMAIL = os.getenv("MEGA_EMAIL")
MEGA_PASSWORD = os.getenv("MEGA_PASSWORD")


MEGA_PATH = r"C:\Users\Amarjeet Singh\AppData\Local\MEGAcmd"


def mega_delete(mega_path: str):
    try:
        run_mega_cmd("mega-rm", [mega_path])
    except Exception as e:
        logger.error(f"MEGA delete failed for {mega_path}: {e}")
        raise Exception(f"MEGA delete failed: {e}")



def run_mega_cmd(cmd_name, args):
    exe_path = os.path.join(MEGA_PATH, cmd_name + ".bat")

    if not os.path.exists(exe_path):
        raise Exception(f"MEGA executable not found: {exe_path}")

    result = subprocess.run(
        [exe_path] + args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        shell=True
    )

    if result.returncode != 0:
        raise Exception(result.stderr.strip())

    return result.stdout.strip()




# ===================================================================
# 🔵 UPLOAD TO MEGA
# ===================================================================
def upload_to_mega(user_id: str, filename: str, file_bytes: bytes):
    folder_path = f"/libraria_notes/{user_id}/"

    tmp_dir = tempfile.mkdtemp()
    local_path = os.path.join(tmp_dir, filename)

    try:
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        # MAKE DIRECTORY (recursive)
        run_mega_cmd("mega-mkdir", ["-p", folder_path])

        # UPLOAD
        run_mega_cmd("mega-put", [local_path, folder_path])

        # EXPORT LINK
        out = run_mega_cmd("mega-export", ["-a", folder_path + filename])
        link = out.split()[-1]

        return link, folder_path + filename

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)




# ===================================================================
# 🔵 UPLOAD NOTE
# ===================================================================
@router.post("/upload", status_code=201)
async def upload_note(
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    token = Depends(get_current_user),
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    subject: str = Form(None),
    course: str = Form(None),
    semester: str = Form(None),
    tags: str = Form(None)
):

    try:
        file_bytes = await file.read()
    except:
        raise HTTPException(400, "Unable to read file")

    filename = file.filename
    size_bytes = len(file_bytes)

    # detect file type
    fn = filename.lower()
    if fn.endswith(".pdf"):
        ftype = "pdf"
    elif fn.endswith((".doc", ".docx")):
        ftype = "doc"
    elif fn.endswith((".ppt", ".pptx")):
        ftype = "ppt"
    else:
        ftype = "unknown"

    # uploader info
    uploaded_by = getattr(token, "user_id", None)
    role = None
    try:
        u = crud_user.get_by_id(db, uploaded_by)
        role = getattr(u, "role", None)
    except:
        pass

    # upload to MEGA
    try:
        mega_public_link, mega_path = upload_to_mega(
            user_id=str(uploaded_by),
            filename=filename,
            file_bytes=file_bytes
        )
    except Exception as e:
        raise HTTPException(500, f"MEGA upload error: {e}")

    # DB payload
    payload = {
        "title": title,
        "description": description,
        "subject": subject,
        "course": course,
        "semester": semester,
        "tags": tags,

        "mega_public_link": mega_public_link,
        "mega_path": mega_path,
        "size_bytes": size_bytes,

        "file_type": ftype,
        "uploaded_by": uploaded_by,
        "uploader_role": role
    }

    try:
        note = create_note(db, NoteCreate(**payload))
        db.commit()
        db.refresh(note)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Database insert failed: {e}")

    # AI analysis in background
    def run_ai(nid: int):
        # Strongly instruct the model to return strict JSON with fields:
        # { "summary": "...", "keywords": [...], "subject": "..." }
        # - summary: 2-3 concise but informative sentences describing the note's contents,
        #            audience, and main themes (use description primarily)
        # - keywords: array of 8-15 relevant keywords/phrases derived from title, description, subject, tags
        # - subject: best-guess subject classification
        prompt = (
            "You are a tool that extracts metadata from an uploaded study note.\n"
            "Given the fields TITLE, DESCRIPTION, SUBJECT, COURSE, SEMESTER, and TAGS, produce a JSON object with exactly three keys: 'summary', 'keywords', and 'subject'.\n"
            "- 'summary': produce 2-3 concise but informative sentences that a student would read to decide whether to download this note. Base your summary on DESCRIPTION primarily; include salient points from TITLE and SUBJECT.\n"
            "- 'keywords': return a JSON array of 8 to 15 concise keywords or short phrases suitable for search and tagging. Derive keywords from TITLE, DESCRIPTION, SUBJECT and TAGS. Avoid stopwords; prefer multi-word phrases when meaningful.\n"
            "- 'subject': return a short subject label (one to three words) that best describes the note.\n"
            "Return ONLY valid JSON and nothing else (no markdown, no explanation). Example: {\"summary\": \"...\", \"keywords\": [\"...\"], \"subject\": \"...\"}\n"
            f"TITLE: {title}\nDESCRIPTION: {description or ''}\nSUBJECT: {subject or ''}\nCOURSE: {course or ''}\nSEMESTER: {semester or ''}\nTAGS: {tags or ''}\nTYPE: {ftype}"
        )

        try:
            llm = call_llama(prompt)
            raw = str(llm)

            # Try to robustly extract a JSON object from the LLM output.
            parsed = None
            try:
                if raw and raw.strip().startswith("{"):
                    parsed = json.loads(raw)
                else:
                    # Look for fenced JSON code block
                    m = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw, flags=re.IGNORECASE)
                    if m:
                        block = m.group(1).strip()
                        # remove possible leading 'json' marker
                        if block.lower().startswith('json'):
                            block = block.split('\n', 1)[1] if '\n' in block else ''
                        try:
                            parsed = json.loads(block)
                        except Exception:
                            parsed = None

                    if parsed is None:
                        # try to find the first {...} JSON-like substring
                        first = raw.find("{")
                        last = raw.rfind("}")
                        if first != -1 and last != -1 and last > first:
                            candidate = raw[first:last+1]
                            try:
                                parsed = json.loads(candidate)
                            except Exception:
                                parsed = None
            except Exception:
                parsed = None

            # Build values to store. If parsed is None, fallback to heuristics.
            summary_val = None
            keywords_val = None
            subject_val = None

            if isinstance(parsed, dict):
                summary_val = parsed.get('summary') or parsed.get('summary_text')
                keywords = parsed.get('keywords') or parsed.get('tags')
                if isinstance(keywords, (list, tuple)):
                    try:
                        keywords_val = json.dumps([str(k).strip() for k in keywords])
                    except Exception:
                        keywords_val = ", ".join([str(k) for k in keywords])
                elif isinstance(keywords, str):
                    # accept comma-separated string
                    try:
                        # split on commas
                        parts = [p.strip() for p in keywords.split(',') if p.strip()]
                        keywords_val = json.dumps(parts)
                    except Exception:
                        keywords_val = keywords

                subject_val = parsed.get('subject') or parsed.get('subject_detection')
            else:
                # fallback heuristics: create a short summary and extract frequent words as keywords
                summary_val = raw[:2000]
                # build candidate text from title, subject, description, tags
                cand = ' '.join([str(x or '') for x in [title, subject, description, tags]])
                # simple tokenization and frequency
                tokens = re.findall(r"\b[\w']{3,}\b", cand.lower())
                stop = set(['the','and','for','with','that','this','from','are','was','were','have','has','had','not','but','you','your','when','where','what','which','how','all','any','our','its','they','them','their','a','an','in','on','of','to','by','as','is'])
                freq = {}
                for t in tokens:
                    if t in stop: continue
                    freq[t] = freq.get(t,0) + 1
                # pick top 10 tokens
                top = sorted(freq.items(), key=lambda x: -x[1])[:10]
                keywords_list = [t for t,_ in top]
                # include title words explicitly
                try:
                    title_tokens = re.findall(r"\b[\w']{3,}\b", str(title or '').lower())
                    for tt in title_tokens:
                        if tt not in keywords_list and tt not in stop:
                            keywords_list.insert(0, tt)
                except Exception:
                    pass
                keywords_val = json.dumps(keywords_list[:15])

            from app.core.database import SessionLocal
            db2 = SessionLocal()
            update_note_ai_fields(db2, nid,
                summary=summary_val,
                keywords=keywords_val,
                subject_detection=subject_val
            )
            db2.close()
        except:
            pass

    # Start the AI processing on a daemon thread so it does not block
    # FastAPI/uvicorn shutdown waiting for background tasks to complete.
    def _start_ai_thread(nid: int):
        try:
            t = threading.Thread(target=run_ai, args=(nid,), daemon=True)
            t.start()
            logger.info(f"Started AI background thread for note {nid}")
        except Exception:
            logger.exception("Failed to start AI background thread")

    background.add_task(_start_ai_thread, note.id)

    # Return a JSONResponse with the serialized dict to avoid pydantic's
    # attribute-based validation reading SQLAlchemy UUID objects.
    # Ensure all values are JSON serializable (handles any remaining datetimes/UUIDs)
    safe = jsonable_encoder(note.dict())
    return JSONResponse(content=safe, status_code=201)


# ===================================================================
# 🔵 LIST / PUBLIC NOTES
# ===================================================================
@router.get("")
def list_public_notes(db: Session = Depends(get_db)):
    """Return public/approved notes for listing pages, including uploader name."""
    notes = db.query(Note).filter(Note.status == "approved").order_by(Note.created_at.desc()).all()
    result = []
    for n in notes:
        nd = n.dict()
        try:
            # try to resolve uploader name from users table
            from app.crud.crud_user import get_by_id as _get_user_by_id
            u = _get_user_by_id(db, nd.get("uploaded_by"))
            if u:
                nd["uploader_name"] = u.full_name or u.username
            else:
                nd["uploader_name"] = None
        except Exception:
            nd["uploader_name"] = None
        result.append(jsonable_encoder(nd))
    return result





# ===================================================================
# 🔵 DIRECT FILE VIEW (opens directLink)
# ===================================================================
@router.get("/{note_id}/view")
async def view_file(request: Request, note_id: int, db: Session = Depends(get_db), authorization: str | None = Header(None)):
    """Stream a note's file using the same proxy-mega logic as books.
    
    This endpoint now delegates to proxy_mega_pdf for consistent behavior:
    - No permission errors on Windows
    - Proper temp file cleanup
    - Streaming response (no permanent downloads)
    """
    note = db.query(Note).filter(Note.id == note_id).first()

    if not note:
        raise HTTPException(404, "Note not found")

    if not note.mega_public_link:
        raise HTTPException(404, "File not found in MEGA")

    # Log the view if we have a user id from Authorization header
    user_id = None
    try:
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split()[1]
            from jose import jwt
            from app.core.config import settings
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                user_id = payload.get("sub")
                if user_id:
                    create_notes_access_log(db, note.id, user_id, "viewed")
            except Exception:
                pass
    except Exception:
        pass

    # Delegate to proxy_mega_pdf which handles all MEGA/streaming logic properly
    return await proxy_mega_pdf(request, note.mega_public_link, db)


# ===================================================================
# 🔵 DOWNLOAD PAGE
# ===================================================================
@router.get("/{note_id}/download")
def download_file(note_id: int, db: Session = Depends(get_db), authorization: str | None = Header(None)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(404, "Note not found")

    # Try to extract user id from Authorization header if present
    user_id = None
    try:
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split()[1]
            from jose import jwt
            from app.core.config import settings
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                user_id = payload.get("sub")
            except Exception:
                user_id = None
    except Exception:
        user_id = None

    # Log the download action only when we have a user id. The frontend
    # already posts an `/access` event (with token) before opening the
    # provider link; avoid creating a duplicate anonymous entry here.
    try:
        if user_id:
            create_notes_access_log(db, note.id, user_id, "downloaded")
    except Exception:
        pass

    return {"url": note.mega_public_link}



# ===================================================================
# 🔵 PENDING NOTES
# ===================================================================
@router.get("/pending")
def pending_notes(db: Session = Depends(get_db), token = Depends(get_current_user)):
    if not getattr(token, "is_admin", False):
        raise HTTPException(403, "Admin only")

    notes = db.query(Note).filter(Note.status == "pending").order_by(Note.created_at.asc()).all()
    return [n.dict() for n in notes]


# ===================================================================
# 🔵 MY NOTES
# ===================================================================
@router.get("/my")
def my_notes(db: Session = Depends(get_db), token = Depends(get_current_user)):
    uid = getattr(token, "user_id", None)
    if not uid:
        raise HTTPException(401, "Login required")

    notes = db.query(Note).filter(Note.uploaded_by == uid).order_by(Note.created_at.desc()).all()
    return [n.dict() for n in notes]


# ===================================================================
# 🔵 APPROVE NOTE
# ===================================================================
@router.post("/{note_id}/approve")
def approve_note(note_id: int, db: Session = Depends(get_db), token = Depends(get_current_user)):
    if not getattr(token, "is_admin", False):
        raise HTTPException(403, "Admin only")

    n = db.query(Note).filter(Note.id == note_id).first()
    if not n:
        raise HTTPException(404, "Note not found")

    n.status = "approved"
    db.commit()
    db.refresh(n)
    return n.dict()


# ===================================================================
# 🔵 REJECT NOTE
# ===================================================================
@router.post("/{note_id}/reject")
def reject_note(note_id: int, payload: dict = Body({}), db: Session = Depends(get_db), token = Depends(get_current_user)):
    if not getattr(token, "is_admin", False):
        raise HTTPException(403, "Admin only")

    n = db.query(Note).filter(Note.id == note_id).first()
    if not n:
        raise HTTPException(404, "Note not found")

    # Extract reason from body (if provided)
    reason = None
    try:
        if isinstance(payload, dict):
            reason = payload.get("reason")
    except Exception:
        reason = None

    if not reason:
        reason = "NONE"

    n.status = "rejected"
    n.rejection_reason = reason
    db.commit()
    db.refresh(n)
    return n.dict()


# ===================================================================
# 🔵 DELETE NOTE (DB ONLY)
# ===================================================================
@router.delete("/{note_id}/delete", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db), token = Depends(get_current_user)):

    n = db.query(Note).filter(Note.id == note_id).first()
    if not n:
        raise HTTPException(404, "Note not found")

    is_admin = getattr(token, "is_admin", False)
    if not is_admin and str(token.user_id) != str(n.uploaded_by):
        raise HTTPException(403, "Not allowed")

    # 1️⃣ Delete from MEGA (if exists)
    if n.mega_path:
        try:
            mega_delete(n.mega_path)
        except Exception as e:
            logger.error(f"Failed to delete MEGA file: {e}")
            # continue anyway — we still delete DB row

    # 2️⃣ Delete DB row
    db.delete(n)
    db.commit()

    return None



# ===================================================================
# 🔵 LOG ACCESS (explicit route for frontend)
# ===================================================================
@router.post("/{note_id}/access")
def log_note_access(note_id: int, payload: dict = Body({}), db: Session = Depends(get_db), authorization: str | None = Header(None)):
    """Record an explicit access event (viewed/downloaded) from the frontend.

    Body: { action: 'viewed' | 'downloaded' }
    Authorization header is optional; if present a user id will be extracted from the token.
    """
    n = db.query(Note).filter(Note.id == note_id).first()
    if not n:
        raise HTTPException(404, "Note not found")

    action = None
    try:
        if isinstance(payload, dict):
            action = payload.get("action")
    except Exception:
        action = None

    if not action:
        raise HTTPException(400, "Missing action")

    # extract user id from bearer token if provided
    user_id = None
    try:
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split()[1]
            from jose import jwt
            from app.core.config import settings
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                user_id = payload.get("sub")
            except Exception:
                user_id = None
    except Exception:
        user_id = None

    try:
        create_notes_access_log(db, n.id, user_id, action)
    except Exception:
        # don't fail the request if logging fails
        pass

    return {"ok": True}


# ===================================================================
# 🔵 MY ACCESS HISTORY
# ===================================================================
@router.get("/history")
def my_access_history(db: Session = Depends(get_db), token = Depends(get_current_user)):
    """Return recent access events for the currently authenticated user.

    Each entry will include the note title and subject where available.
    """
    uid = getattr(token, "user_id", None)
    if not uid:
        raise HTTPException(401, "Login required")

    logs = db.query(NotesAccessLog).filter(NotesAccessLog.user_id == uid).order_by(NotesAccessLog.timestamp.desc()).all()
    result = []
    for l in logs:
        try:
            note = db.query(Note).filter(Note.id == l.note_id).first()
            result.append({
                "id": getattr(l, "id", None),
                "note_id": l.note_id,
                "title": getattr(note, "title", None) if note else None,
                "subject": getattr(note, "subject", None) if note else None,
                "date": l.timestamp.isoformat() if getattr(l, "timestamp", None) is not None else None,
                "action": l.action
            })
        except Exception:
            # skip problematic rows
            continue

    return jsonable_encoder(result)

# ===================================================================
# 🔵 REPORT NOTE
# ===================================================================
@router.post("/{note_id}/report")
def report_note(note_id: int, payload: dict = Body({}), db: Session = Depends(get_db), token = Depends(get_current_user)):
    """Create a report for a note. Requires authentication."""
    n = db.query(Note).filter(Note.id == note_id).first()
    if not n:
        raise HTTPException(404, "Note not found")

    reason = None
    try:
        if isinstance(payload, dict):
            reason = payload.get("reason")
    except Exception:
        reason = None

    if not reason or not str(reason).strip():
        raise HTTPException(400, "Missing reason")

    user_id = getattr(token, "user_id", None)

    try:
        create_notes_report(db, note_id, user_id, str(reason).strip())
    except Exception as e:
        raise HTTPException(500, f"Failed to create report: {e}")

    return {"ok": True}


# ===================================================================
# 🔵 NOTE: LLM ACTION ROUTES (summarize, explain, ask, flashcards)
# These endpoints accept JSON { "text": "..." } and return { "text": "..." }
# They call a specified model (use configured `PREFERRED_OLLAMA_MODEL`) via call_llama_model.
# ===================================================================


@router.post('/summarize')
def notes_summarize(payload: dict = Body({}), db: Session = Depends(get_db), token = Depends(get_current_user)):
    text = None
    try:
        if isinstance(payload, dict):
            text = (payload.get('text') or payload.get('query') or '').strip()
    except Exception:
        text = None

    if not text:
        raise HTTPException(400, "Missing 'text' in request body")

    prompt = f"You are a helpful assistant. Summarize the following text into 2-3 concise sentences for a student:\n\n{text}"
    # use configured preferred model
    result = call_llama_model(prompt, model=PREFERRED_OLLAMA_MODEL)
    return { 'text': str(result) }


@router.post('/explain')
def notes_explain(payload: dict = Body({}), db: Session = Depends(get_db), token = Depends(get_current_user)):
    text = None
    try:
        if isinstance(payload, dict):
            text = (payload.get('text') or payload.get('query') or '').strip()
    except Exception:
        text = None

    if not text:
        raise HTTPException(400, "Missing 'text' in request body")

    prompt = f"You are an expert tutor. Explain the following content in simple, clear terms with examples where helpful:\n\n{text}"
    result = call_llama_model(prompt, model=PREFERRED_OLLAMA_MODEL)
    return { 'text': str(result) }


@router.post('/ask')
def notes_ask(payload: dict = Body({}), db: Session = Depends(get_db), token = Depends(get_current_user)):
    text = None
    try:
        if isinstance(payload, dict):
            text = (payload.get('text') or payload.get('query') or '').strip()
    except Exception:
        text = None

    if not text:
        raise HTTPException(400, "Missing 'text' in request body")

    prompt = f"You are a helpful assistant. Answer the following user question or provide a clear response:\n\n{text}"
    result = call_llama_model(prompt, model=PREFERRED_OLLAMA_MODEL)
    return { 'text': str(result) }


@router.post('/flashcard')
def notes_flashcard(payload: dict = Body({}), db: Session = Depends(get_db), token = Depends(get_current_user)):
    text = None
    try:
        if isinstance(payload, dict):
            text = (payload.get('text') or payload.get('query') or '').strip()
    except Exception:
        text = None

    if not text:
        raise HTTPException(400, "Missing 'text' in request body")

    # Strongly-instruct the model to return ONLY a JSON array of objects.
    # This reduces stray commentary and ensures the frontend can parse reliably.
    prompt = (
        "You are an assistant that converts content into study flashcards.\n"
        "Given the text below, generate up to 8 concise question-and-answer pairs.\n"
        "Each flashcard must be an object with exactly two keys: \"question\" and \"answer\".\n"
        "Return ONLY a JSON array (e.g. [{\"question\": \"...\", \"answer\": \"...\"}, ...]) and nothing else.\n"
        "Do not include any explanation, numbering, or other text. Keep questions and answers concise (questions <= 120 chars, answers <= 300 chars).\n\n"
        "Content:\n" + text
    )

    result = call_llama_model(prompt, model=PREFERRED_OLLAMA_MODEL)

    # try to parse JSON if the model returned JSON
    parsed = None
    try:
        parsed = json.loads(result)
    except Exception:
        parsed = None

    # If initial parse failed, ask the model to strictly reformat its previous output
    if parsed is None:
        try:
            reformat_prompt = (
                "The previous output (below) may contain extra commentary.\n"
                "Convert ONLY the content into a JSON array of objects with keys 'question' and 'answer'.\n"
                "Output must be valid JSON only — no surrounding text or markdown.\n\n"
                "Previous output:\n" + str(result)
            )
            reformatted = call_llama_model(reformat_prompt, model=PREFERRED_OLLAMA_MODEL)
            try:
                parsed = json.loads(reformatted)
            except Exception:
                parsed = None
        except Exception:
            parsed = None

    # If parsing still fails, return the raw text so the frontend can display it for debugging.
    if parsed is None:
        return { 'text': str(result) }

    # Ensure the parsed structure is a list of objects with question/answer keys
    cleaned_cards = []
    try:
        if isinstance(parsed, list):
            for item in parsed[:8]:
                if isinstance(item, dict):
                    q = item.get('question') or item.get('q') or item.get('prompt') or ''
                    a = item.get('answer') or item.get('ans') or item.get('a') or ''
                    cleaned_cards.append({ 'question': str(q).strip(), 'answer': str(a).strip() })
    except Exception:
        pass

    if not cleaned_cards:
        return { 'text': str(result) }

    return { 'cards': cleaned_cards }



@router.post('/chat')
def notes_chat(payload: dict = Body({}), db: Session = Depends(get_db), token = Depends(get_current_user)):
    """Generic chat endpoint used by the frontend. Accepts { text: string, action: 'summarize'|'explain'|'ask'|'flashcard' }
    Returns a streaming text/plain response when local `ollama` is available; otherwise returns the full text.
    """
    text = None
    action = 'ask'
    try:
        if isinstance(payload, dict):
            text = (payload.get('text') or payload.get('query') or '').strip()
            action = (payload.get('action') or 'ask')
    except Exception:
        text = None

    if not text:
        raise HTTPException(400, "Missing 'text' in request body")

    if action == 'summarize':
        prompt = f"You are a helpful assistant. Summarize the following text into 2-3 concise sentences for a student:\n\n{text}"
    elif action == 'explain':
        prompt = f"You are an expert tutor. Explain the following content in simple, clear terms with examples where helpful:\n\n{text}"
    elif action == 'flashcard':
        prompt = (
            "You are an assistant that converts content into study flashcards. "
            "Given the text below, generate up to 8 concise question-and-answer pairs. "
            "Return the output as JSON array of objects with keys 'question' and 'answer'.\n\n" + text
        )
    else:
        prompt = f"You are a helpful assistant. Answer the following user question or provide a clear response:\n\n{text}"

    # Try streaming from local ollama if available; otherwise fall back to non-streaming call
    LLAMA_API_URL = os.getenv('LLAMA_API_URL')

    def stream_generator():
        # If remote API configured, call it and yield the full response
        if LLAMA_API_URL:
            try:
                full = call_llama_model(prompt, model=PREFERRED_OLLAMA_MODEL)
                yield (full or '').encode('utf-8')
                return
            except HTTPException:
                raise
            except Exception as e:
                yield str(e).encode('utf-8')
                return

        # Local ollama CLI streaming
        try:
            cli_model = PREFERRED_OLLAMA_MODEL
            # Open subprocess in binary mode to avoid platform-specific
            # text decoding issues (Windows cp1252). Read/write raw bytes
            # and encode/decode explicitly where needed.
            proc = subprocess.Popen(
                ['ollama', 'run', cli_model],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=0,
            )
            try:
                # send prompt as UTF-8 bytes
                if proc.stdin:
                    try:
                        proc.stdin.write(prompt.encode('utf-8'))
                    except Exception:
                        # fallback: write whatever we can
                        proc.stdin.write(prompt)
                    finally:
                        proc.stdin.close()

                # stream stdout in small chunks to allow frontend to render progressively
                # but decode and clean ANSI/terminal control sequences to avoid
                # spinner/control noise (e.g. "pulling manifest" spinner frames).
                ansi_re = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")
                while True:
                    chunk = proc.stdout.read(64)
                    if not chunk:
                        break

                    # decode as utf-8 with replacement for invalid bytes
                    try:
                        decoded = chunk.decode('utf-8', errors='replace')
                    except Exception:
                        decoded = chunk.decode('latin-1', errors='replace')

                    # remove common ANSI control sequences and carriage returns
                    cleaned = ansi_re.sub('', decoded)
                    cleaned = cleaned.replace('\r', '')
                    # remove braille spinner glyphs that some CLIs emit as spinner frames
                    cleaned = re.sub(r'[⠋⠙⠚⠞⠖⠦⠴⠲⠳⠓⠏⠹⠸⠼]', '', cleaned)

                    # skip empty / spinner-only fragments
                    if not cleaned.strip():
                        continue

                    low = cleaned.lower()
                    # Detect known ollama pull failure and attempt to auto-pull the model,
                    # stream the pull logs to the client, then retry `ollama run`.
                    if 'pull model manifest' in low or 'error: pull model manifest' in low or 'model not found' in low:
                        cli_model = PREFERRED_OLLAMA_MODEL
                        # Inform client that we'll attempt to pull the model
                        try:
                            notice = f"\nModel '{cli_model}' not present locally. Attempting 'ollama pull {cli_model}'...\n"
                            yield notice.encode('utf-8')
                        except Exception:
                            pass

                        # Run `ollama pull <model>` and stream cleaned output
                        try:
                            pull_proc = subprocess.Popen(
                                ['ollama', 'pull', cli_model],
                                stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT,
                                bufsize=0,
                            )
                            try:
                                while True:
                                    pchunk = pull_proc.stdout.read(128)
                                    if not pchunk:
                                        break
                                    try:
                                        pdec = pchunk.decode('utf-8', errors='replace')
                                    except Exception:
                                        pdec = pchunk.decode('latin-1', errors='replace')
                                        pclean = ansi_re.sub('', pdec).replace('\r', '')
                                        pclean = re.sub(r'[⠋⠙⠚⠞⠖⠦⠴⠲⠳⠓⠏⠹⠸⠼]', '', pclean)
                                    if pclean.strip():
                                        # prefix pull logs so frontend can show context
                                        try:
                                            yield ("[pull] " + pclean).encode('utf-8')
                                        except Exception:
                                            yield pclean.encode('utf-8')
                            finally:
                                try:
                                    pull_proc.wait(timeout=30)
                                except Exception:
                                    try:
                                        pull_proc.kill()
                                    except Exception:
                                        pass

                            # If pull succeeded, try to run the model again (streaming)
                            if pull_proc.returncode == 0:
                                try:
                                    # Start a fresh run process and stream from it
                                    proc2 = subprocess.Popen(
                                        ['ollama', 'run', cli_model],
                                        stdin=subprocess.PIPE,
                                        stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT,
                                        bufsize=0,
                                    )
                                    # send prompt
                                    if proc2.stdin:
                                        try:
                                            proc2.stdin.write(prompt.encode('utf-8'))
                                        except Exception:
                                            proc2.stdin.write(prompt)
                                        finally:
                                            proc2.stdin.close()

                                    # stream from proc2 and then return
                                    while True:
                                        chunk2 = proc2.stdout.read(64)
                                        if not chunk2:
                                            break
                                        try:
                                            decoded2 = chunk2.decode('utf-8', errors='replace')
                                        except Exception:
                                            decoded2 = chunk2.decode('latin-1', errors='replace')
                                        cleaned2 = ansi_re.sub('', decoded2).replace('\r', '')
                                        if not cleaned2.strip():
                                            continue
                                        yield cleaned2.encode('utf-8')
                                    try:
                                        proc2.wait(timeout=10)
                                    except Exception:
                                        try:
                                            proc2.kill()
                                        except Exception:
                                            pass
                                    return
                                except Exception:
                                    # Fall through to non-streaming fallback below
                                    pass
                            else:
                                # Pull failed; fall back to non-streaming call
                                try:
                                    full = call_llama_model(prompt, model=cli_model)
                                    yield (full or '').encode('utf-8')
                                except Exception as e:
                                    yield f"Fallback model call failed after pull attempt: {repr(e)}".encode('utf-8')
                                return
                        except FileNotFoundError:
                            # ollama not available; fallback
                            try:
                                full = call_llama_model(prompt, model=cli_model)
                                yield (full or '').encode('utf-8')
                            except Exception as e:
                                yield f"Fallback model call failed: {repr(e)}".encode('utf-8')
                            return

                    # yield cleaned text as utf-8 bytes
                    yield cleaned.encode('utf-8')
            finally:
                try:
                    proc.wait(timeout=10)
                except Exception:
                    try:
                        proc.kill()
                    except Exception:
                        pass
        except FileNotFoundError:
            # Ollama not found; fallback to non-streaming call
            try:
                full = call_llama_model(prompt, model=PREFERRED_OLLAMA_MODEL)
                yield (full or '').encode('utf-8')
                return
            except Exception as e:
                yield str(e).encode('utf-8')
                return

    return StreamingResponse(stream_generator(), media_type='text/plain; charset=utf-8')


# ===================================================================
# 🔵 ADMIN: LIST REPORTED NOTES
# ===================================================================
@router.get("/reports")
def list_reported_notes(db: Session = Depends(get_db), token = Depends(get_current_user)):
    """Return all reported notes for admin review."""
    if not getattr(token, "is_admin", False):
        raise HTTPException(403, "Admin only")

    reports = db.query(NotesReport).order_by(NotesReport.created_at.desc()).all()
    result = []
    for r in reports:
        try:
            note = db.query(Note).filter(Note.id == r.note_id).first()
            reporter_name = None
            try:
                if r.reported_by:
                    u = crud_user.get_by_id(db, r.reported_by)
                    if u:
                        reporter_name = u.full_name or u.username
            except Exception:
                reporter_name = None

            result.append({
                "report_id": getattr(r, "id", None),
                "note_id": r.note_id,
                "title": getattr(note, "title", None) if note else None,
                "reason": getattr(r, "reason", None),
                "reported_by": reporter_name,
                "status": getattr(r, "status", None),
                "admin_response": getattr(r, "admin_response", None),
                "created_at": getattr(r, "created_at", None).isoformat() if getattr(r, "created_at", None) is not None else None,
            })
        except Exception:
            continue

    return jsonable_encoder(result)


# ===================================================================
# 🔵 USER: MY REPORTS
# ===================================================================
@router.get("/reports/my")
def my_reports(db: Session = Depends(get_db), token = Depends(get_current_user)):
    """Return reports created by the currently authenticated user."""
    uid = getattr(token, "user_id", None)
    if not uid:
        raise HTTPException(401, "Login required")

    reports = db.query(NotesReport).filter(NotesReport.reported_by == uid).order_by(NotesReport.created_at.desc()).all()
    result = []
    for r in reports:
        try:
            note = db.query(Note).filter(Note.id == r.note_id).first()
            result.append({
                "report_id": getattr(r, "id", None),
                "note_id": r.note_id,
                "title": getattr(note, "title", None) if note else None,
                "reason": getattr(r, "reason", None),
                "status": getattr(r, "status", None),
                "admin_response": getattr(r, "admin_response", None),
                "created_at": getattr(r, "created_at", None).isoformat() if getattr(r, "created_at", None) is not None else None,
            })
        except Exception:
            continue

    return jsonable_encoder(result)


# ===================================================================
# 🔵 ADMIN: RESOLVE REPORT
# ===================================================================
@router.post("/reports/{report_id}/resolve")
def resolve_report(report_id: int, payload: dict = Body({}), db: Session = Depends(get_db), token = Depends(get_current_user)):
    """Mark a report resolved and optionally add an admin response."""
    if not getattr(token, "is_admin", False):
        raise HTTPException(403, "Admin only")

    r = db.query(NotesReport).filter(NotesReport.id == report_id).first()
    if not r:
        raise HTTPException(404, "Report not found")

    admin_response = None
    try:
        if isinstance(payload, dict):
            admin_response = payload.get("admin_response")
    except Exception:
        admin_response = None

    r.status = "resolved"
    if admin_response and str(admin_response).strip():
        r.admin_response = str(admin_response).strip()

    db.commit()
    db.refresh(r)
    return {"ok": True}


# ===================================================================
# 🔵 ADMIN: NOTES ANALYTICS
# ===================================================================
@router.get("/analytics/summary")
def notes_analytics_summary(db: Session = Depends(get_db)):
    """Return high-level summary metrics for admin dashboard."""

    try:
        total_notes = db.query(func.count(Note.id)).scalar() or 0
    except Exception:
        total_notes = 0

    downloads = db.query(func.count(NotesAccessLog.id)).filter(NotesAccessLog.action == 'downloaded').scalar() or 0
    views = db.query(func.count(NotesAccessLog.id)).filter(NotesAccessLog.action == 'viewed').scalar() or 0

    # unique downloaders over last 7 days
    try:
        since = datetime.utcnow() - timedelta(days=7)
        unique_downloaders_7d = db.query(func.count(func.distinct(NotesAccessLog.user_id))).filter(
            NotesAccessLog.action == 'downloaded',
            NotesAccessLog.timestamp >= since,
            NotesAccessLog.user_id != None
        ).scalar() or 0
    except Exception:
        unique_downloaders_7d = 0

    return {
        "total_notes": int(total_notes),
        "total_downloads": int(downloads),
        "total_views": int(views),
        "unique_downloaders_7d": int(unique_downloaders_7d)
    }


@router.get("/analytics/most_downloaded")
def notes_most_downloaded(limit: int = 10, db: Session = Depends(get_db)):
    """Return top N notes by download count."""

    rows = (
        db.query(NotesAccessLog.note_id.label('note_id'), func.count(NotesAccessLog.id).label('downloads'))
        .filter(NotesAccessLog.action == 'downloaded')
        .group_by(NotesAccessLog.note_id)
        .order_by(desc('downloads'))
        .limit(limit)
        .all()
    )

    result = []
    for r in rows:
        try:
            note = db.query(Note).filter(Note.id == r.note_id).first()
            result.append({
                "note_id": int(r.note_id) if r.note_id is not None else None,
                "title": getattr(note, 'title', None) if note else None,
                "downloads": int(r.downloads or 0),
                "uploaded_by": str(getattr(note, 'uploaded_by', None)) if note else None,
            })
        except Exception:
            continue

    return result


@router.get("/analytics/downloads_per_day")
def notes_downloads_per_day(days: int = 14, db: Session = Depends(get_db)):
    """Return downloads per day for the past `days` days (including today)."""

    try:
        days = max(1, int(days))
    except Exception:
        days = 14

    end = datetime.utcnow().date()
    start = end - timedelta(days=days - 1)

    # SQLite: use strftime to group by day
    rows = (
        db.query(func.strftime('%Y-%m-%d', NotesAccessLog.timestamp).label('day'), func.count(NotesAccessLog.id).label('cnt'))
        .filter(NotesAccessLog.action == 'downloaded')
        .filter(NotesAccessLog.timestamp >= start)
        .group_by('day')
        .order_by('day')
        .all()
    )

    counts_by_day = {r.day: int(r.cnt) for r in rows}

    out = []
    for i in range(days):
        d = (start + timedelta(days=i))
        key = d.strftime('%Y-%m-%d')
        out.append({"date": key, "downloads": counts_by_day.get(key, 0)})

    return out


@router.get("/analytics/views_per_day")
def notes_views_per_day(days: int = 7, db: Session = Depends(get_db)):
    """Return views per day for the past `days` days (including today)."""

    try:
        days = max(1, int(days))
    except Exception:
        days = 7

    end = datetime.utcnow().date()
    start = end - timedelta(days=days - 1)

    rows = (
        db.query(func.strftime('%Y-%m-%d', NotesAccessLog.timestamp).label('day'), func.count(NotesAccessLog.id).label('cnt'))
        .filter(NotesAccessLog.action == 'viewed')
        .filter(NotesAccessLog.timestamp >= start)
        .group_by('day')
        .order_by('day')
        .all()
    )

    counts_by_day = {r.day: int(r.cnt) for r in rows}

    out = []
    for i in range(days):
        d = (start + timedelta(days=i))
        key = d.strftime('%Y-%m-%d')
        out.append({"date": key, "views": counts_by_day.get(key, 0)})

    return out


@router.get("/analytics/top_contributors")
def notes_top_contributors(limit: int = 10, db: Session = Depends(get_db)):
    """Return users who uploaded the most notes."""

    rows = (
        db.query(Note.uploaded_by.label('uid'), func.count(Note.id).label('count'))
        .group_by(Note.uploaded_by)
        .order_by(desc('count'))
        .limit(limit)
        .all()
    )

    result = []
    for r in rows:
        try:
            uid = getattr(r, 'uid', None)
            count = int(getattr(r, 'count', 0) or 0)
            user = None
            if uid:
                try:
                    user = crud_user.get_by_id(db, uid)
                except Exception:
                    user = None

            result.append({
                "user_id": str(uid) if uid is not None else None,
                "name": (user.full_name or user.username) if user else None,
                "count": count,
            })
        except Exception:
            continue

    return result






@router.get("/pdf/proxy")
async def proxy_pdf(request: Request, url: str):
    """Fetch a remote PDF and return it as application/pdf.

    If the provided `url` is a relative path (starts with '/'), convert it
    to an absolute URL using the incoming request's base URL so httpx can
    perform the request. This allows callers to pass `/api/notes/<id>/view`.
    """
    # Resolve relative references to absolute URLs using the request base
    try:
        resolved_url = url
        if isinstance(url, str) and url.startswith("/"):
            base = str(request.base_url).rstrip("/")
            resolved_url = f"{base}{url}"

        # Use a higher timeout because fetching/streaming the file (from MEGA or
        # internal endpoints) can take longer than httpx's default. If your
        # environment requires very large files, increase this further or use
        # an internal file-streaming refactor.
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            r = await client.get(resolved_url)
    except Exception as e:
        # Log and return a 500 with the error message for easier debugging
        logger.exception("PDF proxy failed for url=%s", url)
        raise HTTPException(status_code=500, detail=str(e))

    content_type = r.headers.get("content-type", "")

    # If it's not a PDF, return explicit error
    if "application/pdf" not in content_type:
        raise HTTPException(
            status_code=400,
            detail=f"URL did not return a PDF. Received content-type: {content_type}",
        )

    return Response(
        content=r.content,
        media_type="application/pdf"
    )





@router.get("/proxy-mega")
async def proxy_mega_pdf(request: Request, url: str, db: Session = Depends(get_db)):
    """
    Downloads a MEGA file temporarily, streams it to the client,
    and deletes the file after streaming ends.
    """

    temp_filename = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.pdf")

    try:
        # Resolve relative URLs (allow callers to pass "/api/notes/<id>/view")
        resolved_url = url
        if isinstance(url, str) and url.startswith("/"):
            base = str(request.base_url).rstrip("/")
            resolved_url = f"{base}{url}"

        # 1) If the resolved_url is a MEGA public link (mega.nz), use the MEGA SDK
        #    or MEGAcmd fallback to download the decrypted file. Many mega.nz
        #    shared links return HTML pages when fetched via httpx; the SDK or
        #    megacmd is required to obtain the real file bytes.
        filename_candidate = None
        if isinstance(resolved_url, str) and ("mega.nz" in resolved_url.lower() or resolved_url.lower().startswith("mega://")):
            logger.info(f"proxy-mega: detected mega link, attempting SDK/megacmd download: {resolved_url}")

            # Try to reuse an app-wide mega client if present
            try:
                from main import mega_client as app_mega_client
            except Exception:
                app_mega_client = None

            mega_client_to_use = app_mega_client

            # On Windows the MEGA SDK sometimes fails to move temp files due to
            # file-locking by other processes. Prefer using MEGAcmd on Windows
            # when MEGAcmd is available to avoid PermissionError during move.
            use_megacmd_first = False
            try:
                if os.name == 'nt' and os.path.exists(os.path.join(MEGA_PATH, 'mega-get.bat')):
                    use_megacmd_first = True
            except Exception:
                use_megacmd_first = False

            if not mega_client_to_use and not use_megacmd_first:
                try:
                    m = Mega()
                    mega_client_to_use = m.login(MEGA_EMAIL, MEGA_PASSWORD)
                except Exception:
                    mega_client_to_use = None

            original_path = None
            tmp_download_dir = None
            try:
                if use_megacmd_first:
                    # Prefer megacmd on Windows to avoid SDK file-move issues
                    tmp_download_dir = tempfile.mkdtemp()
                    run_mega_cmd("mega-get", [resolved_url, tmp_download_dir])
                    files = [f for f in os.listdir(tmp_download_dir)]
                    if not files:
                        raise Exception("MEGAcmd failed to fetch file")
                    original_path = os.path.join(tmp_download_dir, files[0])
                else:
                    if mega_client_to_use:
                        # SDK returns a local path to the downloaded/decrypted file
                        try:
                            original_path = mega_client_to_use.download_url(resolved_url)
                            if not original_path or not os.path.exists(original_path):
                                raise Exception("Invalid SDK path from MEGA client")
                        except Exception as e_sdk:
                            # If SDK download fails (move/permission issues), attempt megacmd fallback
                            logger.exception("proxy-mega: SDK download failed, attempting MEGAcmd fallback: %s", e_sdk)
                            tmp_download_dir = tempfile.mkdtemp()
                            try:
                                run_mega_cmd("mega-get", [resolved_url, tmp_download_dir])
                                files = [f for f in os.listdir(tmp_download_dir)]
                                if not files:
                                    raise Exception("MEGAcmd failed to fetch file")
                                original_path = os.path.join(tmp_download_dir, files[0])
                            except Exception as e_mc:
                                # both SDK and MEGAcmd failed
                                logger.exception("proxy-mega: MEGAcmd fallback also failed: %s", e_mc)
                                try:
                                    shutil.rmtree(tmp_download_dir, ignore_errors=True)
                                except Exception:
                                    pass
                                raise Exception(f"Both SDK and MEGAcmd download failed: {e_sdk} | {e_mc}")
                    else:
                        # Fallback to MEGAcmd (requires MEGAcmd installed and configured)
                        tmp_download_dir = tempfile.mkdtemp()
                        run_mega_cmd("mega-get", [resolved_url, tmp_download_dir])
                        files = [f for f in os.listdir(tmp_download_dir)]
                        if not files:
                            raise Exception("MEGAcmd failed to fetch file")
                        original_path = os.path.join(tmp_download_dir, files[0])

                # Copy to our safe temp_filename
                if not original_path or not os.path.exists(original_path):
                    raise Exception("Downloaded file not found")
                try:
                    shutil.copy(original_path, temp_filename)
                except PermissionError:
                    # If we can't copy due to locks, try a streaming copy
                    logger.warning("proxy-mega: shutil.copy PermissionError, trying streaming copy")
                    with open(original_path, "rb") as src, open(temp_filename, "wb") as dst:
                        while True:
                            chunk = src.read(1024 * 32)
                            if not chunk:
                                break
                            dst.write(chunk)

                # try to pick a sensible filename from the SDK / MEGAcmd results
                try:
                    if original_path:
                        filename_candidate = os.path.basename(original_path)
                except Exception:
                    filename_candidate = None

                # cleanup any temporary download dir used by MEGAcmd
                if tmp_download_dir:
                    try:
                        shutil.rmtree(tmp_download_dir, ignore_errors=True)
                    except Exception:
                        pass

            except Exception as e:
                # Clean up and fall back to HTTP fetch below
                logger.exception(f"proxy-mega: MEGA SDK/MEGAcmd download failed: {e}")
                try:
                    if tmp_download_dir:
                        shutil.rmtree(tmp_download_dir, ignore_errors=True)
                except Exception:
                    pass
                # fall through to the httpx fetch method below
        else:
            # Non-mega URLs: attempt a normal HTTP fetch using httpx
            try:
                async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                    async with client.stream("GET", resolved_url) as resp:
                        # Log response status and headers for debugging
                        try:
                            logger.info(f"proxy-mega: GET {resolved_url} -> status={resp.status_code}")
                            hdrs = {k: v for k, v in resp.headers.items()}
                            logger.info(f"proxy-mega: headers={hdrs}")
                        except Exception:
                            logger.exception("Failed to log remote response headers")

                        if resp.status_code != 200:
                            # Try to include a small snippet of the remote response body for debugging
                            try:
                                snippet = await resp.aread()
                                snippet_preview = snippet[:512]
                            except Exception:
                                snippet_preview = b"<unavailable>"
                            logger.error(f"Failed to download remote file: status={resp.status_code} snippet_len={len(snippet_preview)}")
                            raise HTTPException(400, f"Failed to download file: {resp.status_code}")

                        # try to extract filename from remote Content-Disposition header
                        cd = resp.headers.get("content-disposition")
                        if cd:
                            m = re.search(r"filename\*=[^']*''(?P<fname>[^;\r\n]+)", cd)
                            if m:
                                try:
                                    import urllib.parse
                                    filename_candidate = urllib.parse.unquote(m.group('fname').strip('"'))
                                except Exception:
                                    filename_candidate = m.group('fname').strip('"')
                            else:
                                m2 = re.search(r'filename="(?P<fname>[^"]+)"', cd)
                                if m2:
                                    filename_candidate = m2.group('fname')
                                else:
                                    m3 = re.search(r'filename=(?P<fname>[^;\r\n]+)', cd)
                                    if m3:
                                        filename_candidate = m3.group('fname').strip('"')

                        async with aiofiles.open(temp_filename, "wb") as f:
                            async for chunk in resp.aiter_bytes(1024 * 32):
                                await f.write(chunk)
            except Exception:
                # don't overwrite filename_candidate; let the outer except handle errors
                raise
        
        

        # Quick sanity-check the beginning of the downloaded file to ensure it's a PDF
        try:
            import stat
            size = os.path.getsize(temp_filename) if os.path.exists(temp_filename) else 0
            async with aiofiles.open(temp_filename, "rb") as hf:
                head = await hf.read(16)
            is_pdf = False
            try:
                is_pdf = head.startswith(b"%PDF")
            except Exception:
                is_pdf = False
            logger.info(f"proxy-mega: downloaded temp file={temp_filename} size={size} header={head!r} is_pdf={is_pdf}")
        except Exception:
            logger.exception("proxy-mega: failed to inspect downloaded temp file")

        # 2) Generator to stream file
        async def file_stream():
            async with aiofiles.open(temp_filename, "rb") as f:
                while chunk := await f.read(1024 * 32):
                    yield chunk

            # 3) Delete file after streaming
            try:
                os.remove(temp_filename)
            except Exception:
                pass

        # 4) Determine a sensible filename to present to the client
        final_filename = "document.pdf"

        # If the requested URL maps to our internal /api/notes/<id>/view, try to read the DB row
        try:
            m = re.search(r"/api/notes/(?P<id>\d+)/view", resolved_url)
            if m:
                nid = int(m.group('id'))
                try:
                    note = db.query(Note).filter(Note.id == nid).first()
                    if note:
                        # Prefer the stored title, else fallback to the MEGA path basename
                        if getattr(note, 'title', None):
                            # sanitize title for filename use
                            t = str(note.title)
                            t = t.replace('/', '_').replace('\\', '_')
                            final_filename = t
                        elif getattr(note, 'mega_path', None):
                            final_filename = os.path.basename(note.mega_path)
                except Exception:
                    pass
        except Exception:
            pass

        # prefer filename_candidate from remote headers if we don't have better info
        if filename_candidate:
            final_filename = filename_candidate

        # ensure extension present; if not, assume pdf
        if not os.path.splitext(final_filename)[1]:
            final_filename = final_filename + ".pdf"

        # 5) Return streaming response with Content-Disposition using original filename
        return StreamingResponse(
            file_stream(),
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{final_filename}"'}
        )

    except Exception as e:
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception:
                pass
        raise HTTPException(500, f"Proxy failed: {str(e)}")