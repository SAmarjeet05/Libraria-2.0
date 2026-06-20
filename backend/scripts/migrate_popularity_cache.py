#!/usr/bin/env python3
"""
Migration script to create book_popularity_cache table and populate initial cache
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal, engine
from app.models.book_popularity_cache import BookPopularityCache
from app.models.book import Book
from sqlalchemy import inspect, func
from datetime import datetime, timedelta
from app.models.book_view import BookView
from app.models.book_review import BookReview
from app.models.borrow_record import BorrowRecord
from app.models.ebook_issue import EbookIssue

def create_cache_table():
    """Create book_popularity_cache table if it doesn't exist"""
    inspector = inspect(engine)
    
    if 'book_popularity_cache' not in inspector.get_table_names():
        print("Creating book_popularity_cache table...")
        BookPopularityCache.__table__.create(engine, checkfirst=True)
        print("✅ book_popularity_cache table created successfully!")
    else:
        print("⚠️  book_popularity_cache table already exists")

def populate_initial_cache():
    """Populate initial cache for all books"""
    db = SessionLocal()
    
    try:
        print("\nPopulating initial popularity cache...")
        
        # Get all books
        books = db.query(Book).all()
        
        if not books:
            print("⚠️  No books found in database")
            return
        
        now = datetime.utcnow()
        next_update = now + timedelta(minutes=15)
        count = 0
        
        for book in books:
            # Check if cache already exists
            existing_cache = db.query(BookPopularityCache).filter(
                BookPopularityCache.book_id == str(book.id)
            ).first()
            
            if existing_cache:
                print(f"  ⏭️  Skipping {book.title} (cache already exists)")
                continue
            
            # Calculate metrics
            views_count = db.query(func.count(BookView.id)).filter(
                BookView.book_id == str(book.id)
            ).scalar() or 0
            
            reviews_count = db.query(func.count(BookReview.id)).filter(
                BookReview.book_id == str(book.id)
            ).scalar() or 0
            
            issues_count = db.query(func.count(BorrowRecord.id)).filter(
                BorrowRecord.book_id == book.id
            ).scalar() or 0
            
            ebook_issues_count = db.query(func.count(EbookIssue.id)).filter(
                EbookIssue.book_id == str(book.id),
                EbookIssue.status == 'active'
            ).scalar() or 0
            
            # Calculate popularity
            weighted_score = (
                (views_count * 0.2) +
                (reviews_count * 0.3) +
                (issues_count * 0.3) +
                (ebook_issues_count * 0.2)
            )
            
            max_weights = 100
            max_possible = (max_weights * 0.2) + (max_weights * 0.3) + (max_weights * 0.3) + (max_weights * 0.2)
            popularity = min(weighted_score / max_possible, 1.0) if max_possible > 0 else 0.0
            
            # Create cache entry
            cache = BookPopularityCache(
                book_id=str(book.id),
                popularity_score=round(popularity, 3),
                views_count=str(views_count),
                reviews_count=str(reviews_count),
                borrow_issues_count=str(issues_count),
                ebook_issues_count=str(ebook_issues_count),
                last_updated=now,
                next_update=next_update
            )
            
            db.add(cache)
            count += 1
            
            print(f"  ✅ Cached: {book.title} (popularity: {popularity:.3f})")
        
        db.commit()
        print(f"\n✅ Successfully populated cache for {count} books")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error populating cache: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_cache_table()
    populate_initial_cache()
    print("\n" + "="*80)
    print("Migration complete! Cache will auto-update every 15 minutes.")
    print("="*80 + "\n")
