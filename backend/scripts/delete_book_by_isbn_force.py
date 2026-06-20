#!/usr/bin/env python3
"""Force-delete a book row by ISBN using sqlite3 (disables foreign key enforcement).
This bypasses SQLAlchemy foreign-key resolution errors when the DB schema is incomplete.

Usage:
  python scripts\delete_book_by_isbn_force.py --isbn 9876543211
"""
import argparse
import os
import sqlite3
import datetime
import shutil

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.abspath(os.path.join(PROJECT_ROOT, 'libraria.db'))

def backup_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return None
    ts = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    backup_path = DB_PATH + f".backup.{ts}.force"
    shutil.copy2(DB_PATH, backup_path)
    return backup_path

def force_delete(isbn: str):
    if not os.path.exists(DB_PATH):
        print(f"DB not found: {DB_PATH}")
        return False

    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        # Temporarily disable foreign key enforcement so we can remove the row
        cur.execute('PRAGMA foreign_keys = OFF;')
        cur.execute('BEGIN;')
        cur.execute('DELETE FROM books WHERE isbn = ?;', (str(isbn),))
        deleted = cur.rowcount
        conn.commit()
        print(f"Deleted rows: {deleted}")
        return deleted > 0
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        print('Error during forced delete:', e)
        return False
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--isbn', required=True)
    args = parser.parse_args()

    backup = backup_db()
    if backup:
        print(f"Created backup: {backup}")
    ok = force_delete(args.isbn)
    if ok:
        print('Force delete succeeded')
    else:
        print('Force delete did not remove any rows')

if __name__ == '__main__':
    main()
