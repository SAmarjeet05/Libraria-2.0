#!/usr/bin/env python3
"""Ensure `notes` table has `file_name` and `file_id` columns; add them if missing.

Run with PYTHONPATH set to backend.
"""
import sqlite3
from pathlib import Path
import sys
from app.core import database as _database

DB = Path(_database.DB_PATH)
if not DB.exists():
    print('DB not found at', DB)
    sys.exit(1)

conn = sqlite3.connect(str(DB))
cur = conn.cursor()
cur.execute("PRAGMA table_info(notes)")
cols = [r[1] for r in cur.fetchall()]
print('Existing columns:', cols)
changes = False
if 'file_name' not in cols:
    print('Adding column file_name')
    cur.execute("ALTER TABLE notes ADD COLUMN file_name TEXT;")
    changes = True
if 'file_id' not in cols:
    print('Adding column file_id')
    cur.execute("ALTER TABLE notes ADD COLUMN file_id TEXT;")
    changes = True
if changes:
    conn.commit()
    print('Columns added')
else:
    print('No changes needed')
conn.close()
sys.exit(0)
