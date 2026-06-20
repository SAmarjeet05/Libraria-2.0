import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import inspect, text
from app.core.database import engine

def create_review_votes_table():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if 'review_votes' in tables:
        print("✓ review_votes table already exists!")
        return
    
    print("Creating review_votes table...")
    
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE review_votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                review_id INTEGER NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                vote_type VARCHAR(10) NOT NULL CHECK(vote_type IN ('up', 'down')),
                created_at DATETIME NOT NULL,
                UNIQUE(review_id, user_id)
            )
        """))
        conn.commit()
        print("✓ review_votes table created successfully!")
    
    # Show final structure
    print("\nTable structure:")
    inspector = inspect(engine)
    for col in inspector.get_columns('review_votes'):
        print(f"  {col['name']}: {col['type']}")

if __name__ == "__main__":
    create_review_votes_table()
