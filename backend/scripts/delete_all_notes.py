#!/usr/bin/env python3
"""Backup the SQLite DB and delete all rows from the `notes` table.

Usage: python backend/scripts/delete_all_notes.py

This script will:
 - create a timestamped backup of `backend/libraria.db`
 - print current notes count
 - delete all rows from `notes`
 - print post-delete notes count

Be careful: changes are irreversible except via the created backup.
"""
from pathlib import Path
import shutil
import sqlite3
import datetime
import sys

def main():
    script_dir = Path(__file__).resolve().parents[1]  # backend/
    db_path = script_dir / 'libraria.db'

    if not db_path.exists():
        print(f"ERROR: DB file not found at: {db_path}")
        sys.exit(2)

    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = db_path.with_name(f"{db_path.name}.backup.{ts}")
    print(f"Backing up DB: {db_path} -> {backup_path}")
    shutil.copy2(db_path, backup_path)

    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    # Get current count (if table exists)
    try:
        cur.execute('SELECT COUNT(*) FROM notes')
        before = cur.fetchone()[0]
    except sqlite3.OperationalError as e:
        print(f"ERROR reading notes table: {e}")
        conn.close()
        sys.exit(3)

    print(f"Notes before deletion: {before}")

    # Delete all rows
    try:
        cur.execute('DELETE FROM notes')
        conn.commit()
    except Exception as e:
        print(f"ERROR deleting notes rows: {e}")
        conn.rollback()
        conn.close()
        sys.exit(4)

    # Verify
    try:
        cur.execute('SELECT COUNT(*) FROM notes')
        after = cur.fetchone()[0]
    except Exception as e:
        print(f"ERROR verifying notes table after delete: {e}")
        conn.close()
        sys.exit(5)

    conn.close()
    print(f"Notes after deletion: {after}")
    print(f"Backup kept at: {backup_path}")
    return 0

if __name__ == '__main__':
    sys.exit(main())
