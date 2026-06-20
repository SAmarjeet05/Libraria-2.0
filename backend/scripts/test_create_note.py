#!/usr/bin/env python3
from app.core.database import SessionLocal
from app.crud.crud_notes import create_note
from app.schemas.notes import NoteCreate

s = SessionLocal()
try:
    payload = {
        'title': 'Test Note',
        'description': 'desc',
        'mega_public_link': 'https://mega.nz/fake-link',
        'mega_path': '/app-files/1/Test Note.pdf',
        'file_type': 'pdf',
        'size_bytes': 12345
    }
    n = create_note(s, NoteCreate(**payload))
    print('Created note id', n.id)
finally:
    s.close()
