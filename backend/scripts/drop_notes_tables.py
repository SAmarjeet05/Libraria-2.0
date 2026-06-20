"""Drop specific notes-related tables from the database with a safe backup.

This script will:
- create a timestamped backup copy of `libraria.db` in the backend folder
- connect to the database and execute DROP TABLE IF EXISTS for the three tables

Usage:
  python drop_notes_tables.py        # interactive confirmation
  python drop_notes_tables.py --yes  # run non-interactively

WARNING: This action is destructive. Ensure you have a backup before proceeding.
"""

import argparse
import shutil
import os
import datetime
import sys
from sqlalchemy import text

# Import engine path used by the application
try:
    from app.core.database import DB_PATH, engine
except Exception:
    # Fallback: guess the DB path relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    DB_PATH = os.path.abspath(os.path.join(project_root, 'libraria.db'))
    from sqlalchemy import create_engine
    engine = create_engine(f'sqlite:///{DB_PATH}', connect_args={"check_same_thread": False})

TABLES_TO_DROP = [
    'notes_subjects',
    'notes_tags',
    'notes_watchlist'
]


def backup_db(db_path: str) -> str:
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup = f"{db_path}.backup.{ts}"
    shutil.copy2(db_path, backup)
    return backup


def drop_tables(engine, tables):
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            for t in tables:
                print(f"Dropping table if exists: {t}")
                conn.execute(text(f"DROP TABLE IF EXISTS {t};"))
            trans.commit()
        except Exception:
            trans.rollback()
            raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--yes', '-y', action='store_true', help='Run without confirmation')
    args = parser.parse_args()

    if not os.path.exists(DB_PATH):
        print(f"Database file not found: {DB_PATH}")
        sys.exit(1)

    print("This will DROP the following tables from the database:")
    for t in TABLES_TO_DROP:
        print(f" - {t}")
    print()

    if not args.yes:
        resp = input('Type YES to continue and create a backup then drop the tables: ').strip()
        if resp != 'YES':
            print('Aborting.')
            sys.exit(0)

    # Backup
    try:
        backup = backup_db(DB_PATH)
        print(f"Backed up database to: {backup}")
    except Exception as e:
        print(f"Failed to back up database: {e}")
        sys.exit(1)

    # Drop tables
    try:
        drop_tables(engine, TABLES_TO_DROP)
        print('Tables dropped successfully.')
    except Exception as e:
        print(f"Failed to drop tables: {e}")
        print('You can restore from the backup file if needed.')
        sys.exit(1)


if __name__ == '__main__':
    main()
