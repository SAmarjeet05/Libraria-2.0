"""Small diagnostic script to print community_comments rows.

Run from repository root:
python backend/scripts/print_comments.py
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# import DB path from app.core.database if available
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, ROOT)

try:
    from app.core.database import DB_PATH
except Exception:
    DB_PATH = None

def get_engine():
    if DB_PATH:
        db_uri = f"sqlite:///{DB_PATH}"
    else:
        # fallback to sqlite file in backend/database.sqlite
        db_uri = "sqlite:///backend/database.sqlite"
    return create_engine(db_uri, connect_args={"check_same_thread": False})

def main():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        rows = session.execute("SELECT id, post_id, parent_id, user_id, content, created_at FROM community_comments ORDER BY created_at ASC").fetchall()
    except Exception as e:
        print("Failed to query community_comments:", e)
        return

    if not rows:
        print("No comments found in community_comments table.")
        return

    print(f"Found {len(rows)} comments:\n")
    for r in rows:
        print(dict(r))

if __name__ == '__main__':
    main()
