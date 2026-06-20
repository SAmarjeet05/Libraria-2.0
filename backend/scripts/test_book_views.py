"""
Test script for Book Views functionality.
Run this from the backend directory to verify the book views system is working.
"""

import sqlite3
import sys
import os
from datetime import datetime

def test_book_views_table():
    """Test that the book_views table exists and is properly structured."""
    db_path = "libraria.db"
    
    if not os.path.exists(db_path):
        print("✗ Database file not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='book_views'")
        if not cursor.fetchone():
            print("✗ book_views table does not exist")
            conn.close()
            return False
        
        print("✓ book_views table exists")
        
        # Check table schema
        cursor.execute("PRAGMA table_info(book_views)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        
        required_columns = ['id', 'user_id', 'book_id', 'viewed_at', 'session_id']
        for col in required_columns:
            if col not in columns:
                print(f"✗ Missing column: {col}")
                conn.close()
                return False
        
        print("✓ All required columns exist")
        
        # Check indices
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='book_views'")
        indices = [row[0] for row in cursor.fetchall()]
        
        expected_indices = ['idx_book_views_book_id', 'idx_book_views_user_id', 'idx_book_views_viewed_at']
        for idx in expected_indices:
            if idx in indices:
                print(f"✓ Index exists: {idx}")
            else:
                print(f"✗ Missing index: {idx}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_get_view_count():
    """Test that we can query view counts."""
    db_path = "libraria.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Try to get a count (should return 0 initially)
        cursor.execute("SELECT COUNT(*) FROM book_views")
        count = cursor.fetchone()[0]
        print(f"✓ Total views in database: {count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def main():
    print("\n=== Book Views System Test ===\n")
    
    print("Testing database schema...")
    if not test_book_views_table():
        print("\n✗ Schema test failed")
        return False
    
    print("\nTesting query functionality...")
    if not test_get_view_count():
        print("\n✗ Query test failed")
        return False
    
    print("\n✓ All tests passed!")
    print("\nNext steps:")
    print("1. Start the backend server: python main.py")
    print("2. Start the frontend dev server: npm run dev")
    print("3. Open a book details page to record a view")
    print("4. Check the database to verify views were recorded")
    print("\nTo verify in database:")
    print("  sqlite3 libraria.db \"SELECT COUNT(*) FROM book_views;\"")
    print("  sqlite3 libraria.db \"SELECT * FROM book_views LIMIT 5;\"")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
