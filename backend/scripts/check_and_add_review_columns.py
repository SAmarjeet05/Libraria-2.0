import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import inspect, text
from app.core.database import engine

def check_and_add_columns():
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('book_reviews')]
    
    print("Current columns in book_reviews table:")
    for col in columns:
        print(f"  - {col}")
    
    # Check if upvotes and downvotes exist
    needs_upvotes = 'upvotes' not in columns
    needs_downvotes = 'downvotes' not in columns
    
    if needs_upvotes or needs_downvotes:
        print("\nAdding missing columns...")
        with engine.connect() as conn:
            if needs_upvotes:
                print("  Adding upvotes column...")
                conn.execute(text("ALTER TABLE book_reviews ADD COLUMN upvotes INTEGER NOT NULL DEFAULT 0"))
                conn.commit()
            if needs_downvotes:
                print("  Adding downvotes column...")
                conn.execute(text("ALTER TABLE book_reviews ADD COLUMN downvotes INTEGER NOT NULL DEFAULT 0"))
                conn.commit()
        print("✓ Columns added successfully!")
    else:
        print("\n✓ Both upvotes and downvotes columns already exist!")
    
    # Show final structure
    print("\nFinal table structure:")
    inspector = inspect(engine)
    for col in inspector.get_columns('book_reviews'):
        print(f"  {col['name']}: {col['type']}")

if __name__ == "__main__":
    check_and_add_columns()
