from sqlalchemy.orm import Session
from typing import Optional, List

from app.models.notes import Note
from app.schemas.notes import NoteCreate


def get_note(db: Session, note_id: int) -> Optional[Note]:
    return db.query(Note).filter(Note.id == note_id).first()


def create_note(db: Session, note_in: NoteCreate) -> Note:
    data = note_in.dict()
    # Convert any pydantic/URL objects to plain strings for DB binding
    if 'mega_public_link' in data and data.get('mega_public_link') is not None:
        try:
            data['mega_public_link'] = str(data['mega_public_link'])
        except Exception:
            pass
    # default status
    data.setdefault('status', 'pending')
    db_note = Note(**data)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def update_note_ai_fields(db: Session, note_id: int, summary: str = None, keywords: str = None, subject_detection: str = None):
    n = get_note(db, note_id)
    if not n:
        return None
    if summary is not None:
        n.ai_summary = summary
    if keywords is not None:
        n.ai_keywords = keywords
    if subject_detection is not None:
        n.ai_subject_detection = subject_detection
    db.add(n)
    db.commit()
    db.refresh(n)
    return n
