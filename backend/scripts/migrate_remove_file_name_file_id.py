#!/usr/bin/env python3
"""Safely remove `file_name` and `file_id` columns from `notes` table.

This script will:
 - back up the DB to a timestamped file
 - create a new `notes_new` table with the desired schema (matching current model)
 - copy data from `notes` into `notes_new`, mapping legacy columns
 - drop the old `notes` table and rename `notes_new` -> `notes`

Run with PYTHONPATH set to backend.
"""
import sqlite3
from pathlib import Path
import shutil
import datetime
import sys

try:
    from app.core import database as _database
except Exception as e:
    print('Import error:', e)
    print('Run with PYTHONPATH set to backend folder')
    sys.exit(2)

DB = Path(_database.DB_PATH)
if not DB.exists():
    print('DB not found at', DB)
    sys.exit(3)

ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
backup = DB.with_name(f"{DB.name}.backup.{ts}")
print('Backing up DB ->', backup)
shutil.copy2(DB, backup)

conn = sqlite3.connect(str(DB))
cur = conn.cursor()

# Create new table notes_new without file_name/file_id, include legacy fields: file_url, file_page, gofile_file_id
# Note: adjust column types to match existing table as closely as possible
cur.execute('''
CREATE TABLE IF NOT EXISTS notes_new (
    title VARCHAR NOT NULL,
    description TEXT,
    subject VARCHAR,
    course VARCHAR,
    semester VARCHAR,
    tags TEXT,
    file_url VARCHAR,
    file_page VARCHAR,
    viewer_url VARCHAR,
    gofile_file_id VARCHAR,
    file_type VARCHAR,
    uploaded_by VARCHAR(36),
    uploader_role VARCHAR,
    status VARCHAR DEFAULT 'pending',
    rejection_reason TEXT,
    ai_summary TEXT,
    ai_keywords TEXT,
    ai_subject_detection TEXT,
    id INTEGER PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME
);
''')

# Copy over data from old notes -> notes_new for columns that exist
# Determine which columns exist in current notes table
cur.execute("PRAGMA table_info(notes)")
cols = [r[1] for r in cur.fetchall()]
print('Existing notes columns:', cols)

# Columns we will copy (only those present in source)
copy_cols = [
    'title','description','subject','course','semester','tags',
    'file_url','file_page','viewer_url','gofile_file_id','file_type',
    'uploaded_by','uploader_role','status','rejection_reason',
    'ai_summary','ai_keywords','ai_subject_detection','id','created_at','updated_at'
]
available = [c for c in copy_cols if c in cols]
if not available:
    print('No matching columns to copy, aborting')
    conn.close()
    sys.exit(4)

cols_list = ','.join(available)
print('Copying columns:', cols_list)
cur.execute(f"INSERT INTO notes_new ({cols_list}) SELECT {cols_list} FROM notes;")
conn.commit()

# Replace tables
cur.execute('DROP TABLE notes')
cur.execute('ALTER TABLE notes_new RENAME TO notes')
conn.commit()

# Verify
cur.execute("PRAGMA table_info(notes)")
new_cols = [r[1] for r in cur.fetchall()]
print('New notes columns:', new_cols)
conn.close()
print('Migration complete; backup at', backup)
sys.exit(0)
