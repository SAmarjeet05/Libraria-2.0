"""Add a 'location' column to the books table and set a default location for existing rows.

Usage: python add_location_to_books.py

This script will:
- ALTER TABLE books ADD COLUMN location TEXT DEFAULT 'Main Library - Shelf A1'
- Update NULL or empty locations to 'Main Library - Shelf A1'

Note: Run this from the repository root or adjust the DB path if needed.
"""
import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'libraria.db'))
# Try common paths if not found
if not os.path.exists(DB_PATH):
    # fallback to app database path if different
    DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app', 'data', 'libraria.db'))

print('Using DB path:', DB_PATH)
if not os.path.exists(DB_PATH):
    print('Database file not found. Please adjust DB_PATH in this script to point to your sqlite file.')
    raise SystemExit(1)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

try:
    # Add column (SQLite supports ADD COLUMN)
    cur.execute("ALTER TABLE books ADD COLUMN location TEXT DEFAULT 'Main Library - Shelf A1'")
    print('Added column location')
except Exception as e:
    print('Could not add column (it may already exist):', e)

# Update existing rows where location is NULL or empty
cur.execute("UPDATE books SET location = 'Main Library - Shelf A1' WHERE location IS NULL OR TRIM(location) = ''")
print('Updated existing rows')

conn.commit()
conn.close()
print('Done')
