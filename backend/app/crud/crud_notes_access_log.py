from typing import Optional
from sqlalchemy.orm import Session
from app.models.notes_access_log import NotesAccessLog


def create_notes_access_log(db: Session, note_id: int, user_id: Optional[str], action: str):
    """Insert a notes access log record.

    user_id may be None for anonymous accesses.
    action should be a short string like 'viewed' or 'downloaded'.
    """
    nal = NotesAccessLog(
        note_id=note_id,
        user_id=user_id,
        action=action
    )
    db.add(nal)
    db.commit()
    db.refresh(nal)
    return nal
