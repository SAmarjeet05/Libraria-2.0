from sqlalchemy.orm import Session
from app.models.notes_report import NotesReport
from app.models.notes import Note


def create_notes_report(db: Session, note_id: int, reported_by: str, reason: str):
    nr = NotesReport(
        note_id=note_id,
        reported_by=reported_by,
        reason=reason,
    )
    # ensure report status is explicitly pending
    try:
        nr.status = "pending"
    except Exception:
        pass

    db.add(nr)
    db.commit()
    db.refresh(nr)
    return nr
