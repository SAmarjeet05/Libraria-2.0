"""
Migration script: replace `file_url` column with `file_name` and `file_id` in SQLite notes table.
Usage: run from `backend` directory: `python scripts/migrate_notes_remove_file_url_add_file_name_file_id.py`

This script will:
- Back up the existing database file (app.core.database.DB_PATH) to a timestamped .bak file
- Create a new `notes_new` table with the desired columns
- Copy rows from `notes` into `notes_new`, extracting `file_name` from existing `file_url` when present
- Drop the old `notes` table and rename `notes_new` to `notes`

Note: This is a one-shot migration script for SQLite.
"""

import shutil
import sqlite3
import datetime
from urllib.parse import urlparse, unquote

from app.core.database import DB_PATH

print(f"Using DB at: {DB_PATH}")
# Backup DB
bak_path = DB_PATH + ".migration_backup." + datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
print(f"Backing up DB to: {bak_path}")
shutil.copy2(DB_PATH, bak_path)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

try:
    # Fetch existing rows
    cur.execute("PRAGMA foreign_keys = OFF;")
    conn.commit()

    cur.execute(
        '''SELECT id, title, description, subject, course, semester, tags, file_url, file_type,
                  uploaded_by, uploader_role, status, rejection_reason, ai_summary, ai_keywords, ai_subject_detection,
                  created_at, updated_at
           FROM notes'''
    )
    rows = cur.fetchall()

    # Create new table
    cur.execute('''
        CREATE TABLE notes_new (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            subject TEXT,
            course TEXT,
            semester TEXT,
            tags TEXT,
            file_name TEXT,
            file_id TEXT,
            file_type TEXT,
            uploaded_by TEXT,
            uploader_role TEXT,
            status TEXT DEFAULT 'pending',
            rejection_reason TEXT,
            ai_summary TEXT,
            ai_keywords TEXT,
            ai_subject_detection TEXT,
            created_at DATETIME,
            updated_at DATETIME
        );
    ''')

    # Insert rows into notes_new
    insert_sql = '''INSERT INTO notes_new
        (id, title, description, subject, course, semester, tags, file_name, file_id, file_type,
         uploaded_by, uploader_role, status, rejection_reason, ai_summary, ai_keywords, ai_subject_detection,
         created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'''

    for r in rows:
        file_url = r['file_url']
        file_name = None
        file_id = None
        if file_url:
            try:
                p = urlparse(file_url)
                file_name = unquote(p.path.rsplit('/', 1)[-1])
            except Exception:
                file_name = None
        values = (
            r['id'], r['title'], r['description'], r['subject'], r['course'], r['semester'], r['tags'],
            file_name, file_id, r['file_type'], r['uploaded_by'], r['uploader_role'], r['status'],
            r['rejection_reason'], r['ai_summary'], r['ai_keywords'], r['ai_subject_detection'],
            r['created_at'], r['updated_at']
        )
        cur.execute(insert_sql, values)

    # Drop old table and rename
    cur.execute('DROP TABLE notes')
    cur.execute('ALTER TABLE notes_new RENAME TO notes')

    conn.commit()
    print('Migration completed successfully.')
    print(f'Backup is at: {bak_path}')

except Exception as e:
    conn.rollback()
    print('Migration failed:', e)
    print('Restoring backup...')
    conn.close()
    shutil.copy2(bak_path, DB_PATH)
    print('Restored backup from:', bak_path)
    raise
finally:
    conn.close()
