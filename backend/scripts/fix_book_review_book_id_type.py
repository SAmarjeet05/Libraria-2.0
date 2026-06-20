import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import inspect, text
from app.core.database import engine

def fix_book_id_column():
    inspector = inspect(engine)
    columns = {col['name']: col for col in inspector.get_columns('book_reviews')}
    
    print("Current book_reviews.book_id type:", columns.get('book_id', {}).get('type'))
    
    # SQLite requires recreating the table to change column types
    print("\nRecreating book_reviews table with correct book_id type (VARCHAR)...")
    
    with engine.connect() as conn:
        # Create new table with correct schema
        conn.execute(text("""
            CREATE TABLE book_reviews_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id VARCHAR(36) NOT NULL,
                book_id VARCHAR(36) NOT NULL,
                rating INTEGER NOT NULL DEFAULT 0,
                review_text TEXT,
                upvotes INTEGER NOT NULL DEFAULT 0,
                downvotes INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL,
                updated_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (book_id) REFERENCES books(id)
            )
        """))
        
        # Copy existing data (none expected since book_id was wrong type)
        try:
            conn.execute(text("""
                INSERT INTO book_reviews_new (id, user_id, book_id, rating, review_text, upvotes, downvotes, created_at, updated_at)
                SELECT id, user_id, CAST(book_id AS VARCHAR), rating, review_text, upvotes, downvotes, created_at, updated_at
                FROM book_reviews
            """))
            print("Copied existing reviews")
        except Exception as e:
            print(f"No existing data to copy (expected): {e}")
        
        # Drop old table
        conn.execute(text("DROP TABLE book_reviews"))
        
        # Rename new table
        conn.execute(text("ALTER TABLE book_reviews_new RENAME TO book_reviews"))
        
        conn.commit()
        print("✓ Table recreated successfully!")
    
    # Show final structure
    print("\nFinal table structure:")
    inspector = inspect(engine)
    for col in inspector.get_columns('book_reviews'):
        print(f"  {col['name']}: {col['type']}")

if __name__ == "__main__":
    fix_book_id_column()
