#!/usr/bin/env python3
"""
Safe script to drop legacy tables that should no longer exist.

This script will:
- Create a timestamped backup of `libraria.db` in the `backend/` folder.
- Connect to the DB and DROP TABLE IF EXISTS for the configured table names.
- Print a summary of actions.

Usage (PowerShell):
  cd backend
  python .\scripts\drop_old_tables.py

Note: This script is destructive to the listed tables. It creates a backup
before making changes and preserves the backup file in the same folder.
"""
from pathlib import Path
import shutil
import sqlite3
import datetime
import sys

# Tables we want to remove
TABLES_TO_DROP = [
    "notes_subjects",
    "notes_tags",
    "notes_watchlist",
    "book_requests_old",
]


def main():
    repo_backend = Path(__file__).resolve().parents[1]
    db_path = repo_backend / "libraria.db"

    if not db_path.exists():
        print(f"ERROR: database not found at {db_path}")
        sys.exit(1)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = repo_backend / f"libraria.db.backup.drop_old_tables.{timestamp}"

    print(f"Backing up DB: {db_path} -> {backup_path}")
    shutil.copy2(db_path, backup_path)

    conn = sqlite3.connect(str(db_path))
    try:
        cur = conn.cursor()
        # disable foreign key checks while dropping
        cur.execute("PRAGMA foreign_keys = OFF;")
        for t in TABLES_TO_DROP:
            print(f"Dropping table if exists: {t}")
            try:
                cur.execute(f"DROP TABLE IF EXISTS {t};")
            except Exception as e:
                print(f"  - Failed to drop {t}: {e}")
        conn.commit()
        print("Drops committed. Re-enabling foreign keys.")
        cur.execute("PRAGMA foreign_keys = ON;")
    finally:
        conn.close()

    print("Done. If you restarted the server after removing the model files, the tables should not be re-created.")
    print(f"Backup preserved at: {backup_path}")


if __name__ == '__main__':
    main()
