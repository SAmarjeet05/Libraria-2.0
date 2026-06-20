#!/usr/bin/env python3
"""Backup DB, drop existing `notes` table and recreate it from the SQLAlchemy model.

Usage: set PYTHONPATH to backend and run:
$env:PYTHONPATH='C:\path\to\repo\backend'; python backend\scripts\recreate_notes_table.py

This script:
 - creates a timestamped backup of the DB
 - imports `app.models.notes` to ensure the model is registered with `Base`
 - drops the existing `notes` table (if present)
 - creates the `notes` table from the model
 - prints PRAGMA table_info(notes)

Be careful: the backup file allows recovery if needed.
"""
from pathlib import Path
import shutil
import datetime
import sqlite3
import sys

try:
    # Import project database and model to load metadata
    from app.core import database as _database
except Exception as e:
    print('Failed to import app.core.database:', e)
    print('Make sure to run this script with PYTHONPATH set to backend folder.')
    sys.exit(2)

# Ensure model is imported so SQLAlchemy metadata contains the table
try:
    import app.models.notes  # noqa: F401
except Exception as e:
    print('Failed to import app.models.notes:', e)
    sys.exit(3)

DB_PATH = Path(_database.DB_PATH)
if not DB_PATH.exists():
    print('DB not found at', DB_PATH)
    sys.exit(4)

# Backup
ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
backup = DB_PATH.with_name(f"{DB_PATH.name}.backup.{ts}")
print(f'Backing up DB: {DB_PATH} -> {backup}')
shutil.copy2(DB_PATH, backup)

engine = _database.engine
Base = _database.Base

# Check table exists and drop/create
if 'notes' in Base.metadata.tables:
    tbl = Base.metadata.tables['notes']
    print('Dropping existing `notes` table (if present)')
    tbl.drop(engine, checkfirst=True)
    print('Creating `notes` table from model')
    tbl.create(engine, checkfirst=True)
else:
    print('`notes` table not found in SQLAlchemy metadata; did import fail?')
    sys.exit(5)

# Print schema using sqlite PRAGMA
try:
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(notes)")
    rows = cur.fetchall()
    if not rows:
        print('PRAGMA returned no rows; table may not exist')
    else:
        print('notes table schema:')
        for r in rows:
            # (cid, name, type, notnull, dflt_value, pk)
            print(r)
    conn.close()
except Exception as e:
    print('Failed to query DB schema:', e)
    sys.exit(6)

print('Recreate completed. Backup kept at', backup)
sys.exit(0)
