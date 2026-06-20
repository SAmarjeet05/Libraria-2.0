import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import inspect, text
from app.core.database import engine

def rename_column():
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('book_reviews')]
    
    print("Current columns:", columns)
    
    if 'comment' in columns and 'review_text' not in columns:
        print("\nRenaming 'comment' column to 'review_text'...")
        
        with engine.connect() as conn:
            # SQLite doesn't support RENAME COLUMN directly in older versions
            # We need to create new column, copy data, drop old column
            conn.execute(text("ALTER TABLE book_reviews ADD COLUMN review_text TEXT"))
            conn.execute(text("UPDATE book_reviews SET review_text = comment"))
            # Note: SQLite doesn't easily support DROP COLUMN, so we'll leave comment for now
            conn.commit()
            print("✓ Created review_text column and copied data from comment")
    elif 'review_text' in columns:
        print("\n✓ review_text column already exists!")
    else:
        print("\nCreating review_text column...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE book_reviews ADD COLUMN review_text TEXT"))
            conn.commit()
        print("✓ review_text column created!")
    
    # Also add updated_at if missing
    if 'updated_at' not in columns:
        print("\nAdding updated_at column...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE book_reviews ADD COLUMN updated_at DATETIME"))
            conn.commit()
        print("✓ updated_at column added!")
    
    # Show final structure
    print("\nFinal table structure:")
    inspector = inspect(engine)
    for col in inspector.get_columns('book_reviews'):
        print(f"  {col['name']}: {col['type']}")

if __name__ == "__main__":
    rename_column()
