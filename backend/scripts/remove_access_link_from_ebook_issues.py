"""
Safe SQLite migration: remove `access_link` column from `ebook_issues` table.

What this script does:
 - Makes a timestamped backup copy of the sqlite DB (libraria.db)
 - Checks whether the `ebook_issues` table contains an `access_link` column
 - If present, creates a new table `ebook_issues_new` without that column,
   copies data across, drops the old table and renames the new table
 - Prints a summary and exits

Run from repository root (or ensure paths below match your layout):
python backend/scripts/remove_access_link_from_ebook_issues.py

"""
import sqlite3
import shutil
import os
import datetime
import sys

# Prefer to import the canonical DB_PATH from the app to avoid mismatches
try:
    # This will work when run from the project root (app package is importable)
    from app.core.database import DB_PATH as CANON_DB_PATH
    DB_PATH = CANON_DB_PATH
except Exception:
    # Fallback: try to locate the DB relative to this script (backend/libraria.db)
    DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))

def table_has_column(conn, table, column):
    cur = conn.execute(f"PRAGMA table_info({table})")
    cols = [r[1] for r in cur.fetchall()]
    return column in cols

def backup_db(db_path):
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    dest = f"{db_path}.backup.{ts}"
    shutil.copy2(db_path, dest)
    return dest

def run():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        sys.exit(1)

    print(f"Using DB: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    try:
        if not table_has_column(conn, 'ebook_issues', 'access_link'):
            print("No access_link column found on ebook_issues; nothing to do.")
            return

        backup = backup_db(DB_PATH)
        print(f"Backup created: {backup}")

        cur = conn.cursor()
        print("Starting migration: creating new table without access_link...")

        # Create new table (types are TEXT for UUIDs/datetimes to stay compatible)
        cur.execute("PRAGMA foreign_keys=off;")
        conn.commit()

        cur.execute('''
        CREATE TABLE IF NOT EXISTS ebook_issues_new (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            issued_at TEXT NOT NULL,
            expiry_date TEXT,
            status TEXT NOT NULL
        );
        ''')

        # Copy data (omit access_link)
        cur.execute('''
        INSERT INTO ebook_issues_new (id, user_id, book_id, issued_at, expiry_date, status)
        SELECT id, user_id, book_id, issued_at, expiry_date, status FROM ebook_issues;
        ''')

        # Drop old table and rename new
        cur.execute('DROP TABLE ebook_issues;')
        cur.execute('ALTER TABLE ebook_issues_new RENAME TO ebook_issues;')

        conn.commit()
        print("Migration completed successfully. access_link column removed.")
    except Exception as e:
        conn.rollback()
        print("Migration failed:", e)
        print("You can restore the DB from the backup file created earlier.")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    run()
