"""
Script to correct notes that were mistakenly marked as 'resolved' in the notes table.
Run from the `backend` folder:

    python scripts/fix_resolved_notes.py

This will scan the `notes` table for rows where `status == 'resolved'` and set
`status = 'approved'` for each such row. It prints the number of rows updated.
"""

from app.core.database import SessionLocal
from app.models.notes import Note


def main():
    db = SessionLocal()
    try:
        resolved_notes = db.query(Note).filter(Note.status == 'resolved').all()
        count = len(resolved_notes)
        if count == 0:
            print("No notes with status 'resolved' found.")
            return

        for n in resolved_notes:
            print(f"Updating Note id={n.id} title={getattr(n, 'title', '')!r}")
            n.status = 'approved'
            db.add(n)

        db.commit()
        print(f"Updated {count} notes from 'resolved' to 'approved'.")
    finally:
        db.close()


if __name__ == '__main__':
    main()
