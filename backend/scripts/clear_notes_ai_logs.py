"""Backup the SQLite DB and clear all rows from `notes_ai_logs`.

Usage (PowerShell):
  python backend\scripts\clear_notes_ai_logs.py

This script will:
 - copy `backend/libraria.db` to a timestamped backup in the same directory
 - report the number of rows in `notes_ai_logs` before deletion
 - delete all rows from `notes_ai_logs` and run VACUUM
 - report the number of rows after deletion

Run this only on the machine hosting the DB.
"""
import os
import shutil
import sqlite3
import datetime
import sys


DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))


def backup_db(db_path: str) -> str:
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    dirname = os.path.dirname(db_path)
    base = os.path.basename(db_path)
    backup_name = f"{base}.backup.{ts}"
    backup_path = os.path.join(dirname, backup_name)
    shutil.copy2(db_path, backup_path)
    return backup_path


def count_rows(conn, table_name: str) -> int:
    cur = conn.execute(f"SELECT COUNT(*) FROM {table_name}")
    return cur.fetchone()[0]


def main():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        sys.exit(1)

    print(f"Database: {DB_PATH}")
    try:
        backup = backup_db(DB_PATH)
        print(f"Created backup: {backup}")
    except Exception as e:
        print(f"ERROR: Failed to create backup: {e}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    try:
        before = count_rows(conn, 'notes_ai_logs')
        print(f"Rows in notes_ai_logs before delete: {before}")
        if before == 0:
            print("Table already empty. No action needed.")
            return

        # Delete all rows
        conn.execute('DELETE FROM notes_ai_logs;')
        conn.commit()

        # Optionally reclaim space
        conn.execute('VACUUM;')

        after = count_rows(conn, 'notes_ai_logs')
        print(f"Rows in notes_ai_logs after delete: {after}")
        if after == 0:
            print("Cleared notes_ai_logs successfully.")
        else:
            print("Warning: some rows remain after deletion.")
    except Exception as e:
        print(f"ERROR while clearing table: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == '__main__':
    main()
