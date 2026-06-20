"""
Migration script to add book_views table to the database.
Run this from the backend directory: python scripts/add_book_views_table.py
"""

import sqlite3
import os
from datetime import datetime

def add_book_views_table():
    # Get database path
    db_path = "libraria.db"
    
    if not os.path.exists(db_path):
        print(f"Error: Database file '{db_path}' not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='book_views'")
        if cursor.fetchone():
            print("✓ book_views table already exists")
            conn.close()
            return True
        
        # Create the table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS book_views (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                book_id VARCHAR(36) NOT NULL,
                viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                session_id VARCHAR,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (book_id) REFERENCES books(id)
            )
        """)
        
        # Create indices for better query performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_book_views_book_id ON book_views(book_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_book_views_user_id ON book_views(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_book_views_viewed_at ON book_views(viewed_at)")
        
        conn.commit()
        print("✓ book_views table created successfully")
        
        # Verify the table was created
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='book_views'")
        schema = cursor.fetchone()
        if schema:
            print(f"✓ Table schema: {schema[0]}")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = add_book_views_table()
    if success:
        print("\n✓ Migration completed successfully")
    else:
        print("\n✗ Migration failed")
