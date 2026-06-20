"""
NotesSubject model removed.

This file previously defined the `notes_subjects` table. The model has
been intentionally removed to prevent the table from being auto-created
on application startup. If you need to keep the model, restore the
original class definition.

Table cleanup should be performed with the `backend/scripts/drop_old_tables.py`
script which safely backs up the database and drops the old tables.
"""

__all__ = []
