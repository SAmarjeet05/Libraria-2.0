#!/usr/bin/env python3
"""Safe script to backup the SQLite DB and delete a book by ISBN.

Usage:
  python scripts\delete_book_by_isbn.py --isbn 9876543211 [--yes]

This script will create a timestamped backup of `libraria.db` in the same
directory before deleting the matching book row.
"""
import argparse
import shutil
import datetime
import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB_PATH = os.path.abspath(os.path.join(PROJECT_ROOT, 'libraria.db'))

def backup_db():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return None
    ts = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    backup_path = DB_PATH + f".backup.{ts}"
    shutil.copy2(DB_PATH, backup_path)
    return backup_path

def delete_book_by_isbn(isbn: str):
    # Import DB session and models from app
    sys.path.insert(0, PROJECT_ROOT)
    try:
        from app.core.database import SessionLocal
        from app.models.book import Book
    except Exception as e:
        print("Failed to import application modules:", e)
        return False

    db = SessionLocal()
    try:
        b = db.query(Book).filter(Book.isbn == str(isbn)).first()
        if not b:
            print(f"No book found with ISBN {isbn}")
            return False
        print("Found book:")
        try:
            print(f"  id: {b.id}\n  title: {b.title}\n  author: {b.author}\n  isbn: {b.isbn}\n  ebook_url: {b.ebook_url}")
        except Exception:
            pass
        db.delete(b)
        db.commit()
        print(f"Deleted book with ISBN {isbn}")
        return True
    except Exception as e:
        print("Error deleting book:", e)
        db.rollback()
        return False
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--isbn', required=True, help='ISBN of the book to delete')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation')
    args = parser.parse_args()

    print(f"Database path: {DB_PATH}")
    if not args.yes:
        confirm = input(f"This will BACKUP the DB and DELETE any book with ISBN {args.isbn}. Continue? [y/N]: ")
        if confirm.lower() != 'y':
            print('Aborted')
            return

    backup = backup_db()
    if backup:
        print(f"Backed up database to: {backup}")
    else:
        print("Backup skipped or failed; aborting.")
        return

    ok = delete_book_by_isbn(args.isbn)
    if ok:
        print('Operation completed successfully.')
    else:
        print('Operation failed or nothing was deleted.')

if __name__ == '__main__':
    main()
