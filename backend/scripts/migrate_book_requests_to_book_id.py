"""
Migration script: change `book_requests` table structure to (id, user_id, book_id, status, created_at).

This script performs a safe backup of the SQLite database, then creates a new table
`book_requests_new`, copies rows from the old `book_requests` table, attempting to map
`title` -> `books.id` where possible, and then renames the new table to `book_requests`.

Run from the `backend` directory with the project's Python environment activated:

    python scripts/migrate_book_requests_to_book_id.py

The script will create a backup file next to `libraria.db` named `libraria.db.backup.<ts>`.
"""
import sqlite3
import os
import shutil
import datetime
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'libraria.db')
DB_PATH = os.path.abspath(DB_PATH)

if not os.path.exists(DB_PATH):
    print("Database not found at:", DB_PATH)
    sys.exit(1)

# 1) backup
ts = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
backup_path = DB_PATH + f'.backup.{ts}'
print('Backing up DB to', backup_path)
shutil.copy2(DB_PATH, backup_path)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# 2) create new table
print('Creating new table book_requests_new')
cur.execute('''
CREATE TABLE IF NOT EXISTS book_requests_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    book_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT (datetime('now'))
)
''')
conn.commit()

# 3) copy rows from old table if exists
print('Inspecting existing book_requests table...')
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='book_requests'")
if cur.fetchone() is None:
    print('No existing book_requests table found — nothing to migrate.')
    conn.close()
    sys.exit(0)

print('Fetching old rows...')
cur.execute('SELECT id, user_id, title, author, reason, status, created_at FROM book_requests')
rows = cur.fetchall()
print(f'Found {len(rows)} rows to migrate')

for row in rows:
    old_id, user_id, title, author, reason, status, created_at = row
    book_id = None
    # Try to find a book by title (best-effort). If found, use its id
    try:
        cur.execute('SELECT id FROM books WHERE title = ?', (title,))
        r = cur.fetchone()
        if r:
            book_id = r[0]
    except Exception:
        book_id = None

    # Normalize status
    stat = (status or 'pending').lower()
    if stat in ('approved', 'granted'):
        stat = 'granted'
    elif stat in ('rejected', 'denied'):
        stat = 'rejected'
    else:
        stat = 'pending'

    cur.execute(
        'INSERT INTO book_requests_new (user_id, book_id, status, created_at) VALUES (?, ?, ?, ?)',
        (str(user_id) if user_id is not None else None, book_id, stat, created_at)
    )

conn.commit()

# 4) rename tables: keep a backup of the old table
print('Renaming old table to book_requests_old and promoting new table')
cur.execute('ALTER TABLE book_requests RENAME TO book_requests_old')
cur.execute('ALTER TABLE book_requests_new RENAME TO book_requests')
conn.commit()

print('Migration completed. Old table preserved as book_requests_old. If everything looks good, you may drop it manually.')
conn.close()
print('Done.')
