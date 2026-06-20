"""Migration helper: add 'status' column to users table if missing.
Run: python backend\scripts\add_user_status_column.py
"""
import sqlite3
import os
from app.core.database import DB_PATH

def main():
    db_path = DB_PATH
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(users)")
        cols = [row[1] for row in cur.fetchall()]
        if 'status' in cols:
            print("Column 'status' already exists.")
            return
        print("Adding 'status' column to users table...")
        # Use enum member NAME (e.g. 'ACTIVE') to match SQLAlchemy Enum storage
        cur.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE'")
        conn.commit()
        print("Done. 'status' column added with default 'ACTIVE'.")
    except Exception as e:
        print("Failed to add column:", e)
    finally:
        conn.close()

if __name__ == '__main__':
    main()
