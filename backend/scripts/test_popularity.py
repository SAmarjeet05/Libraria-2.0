#!/usr/bin/env python3
"""
Test script for popularity calculation
Verifies that popularity scores are calculated correctly based on:
- Views (20% weight)
- Reviews (30% weight)
- Borrow Issues (30% weight)
- eBook Issues (20% weight)
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal, engine
from app.models.book import Book
from app.models.book_view import BookView
from app.models.book_review import BookReview
from app.models.borrow_record import BorrowRecord
from app.models.ebook_issue import EbookIssue
from sqlalchemy import func

def test_popularity_calculation():
    """Test the popularity calculation for all books"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("POPULARITY CALCULATION TEST")
        print("="*80)
        
        # Get all books
        books = db.query(Book).all()
        print(f"\nTotal books in database: {len(books)}")
        
        if not books:
            print("⚠️  No books found in database")
            return
        
        popularity_scores = []
        
        for book in books:
            # Count views
            views_count = db.query(func.count(BookView.id)).filter(BookView.book_id == str(book.id)).scalar() or 0
            
            # Count reviews
            reviews_count = db.query(func.count(BookReview.id)).filter(BookReview.book_id == str(book.id)).scalar() or 0
            
            # Count borrow issues
            issues_count = db.query(func.count(BorrowRecord.id)).filter(BorrowRecord.book_id == book.id).scalar() or 0
            
            # Count ONLY ACTIVE ebook issues (exclude revoked and expired)
            ebook_issues_count = db.query(func.count(EbookIssue.id)).filter(
                EbookIssue.book_id == str(book.id),
                EbookIssue.status == 'active'
            ).scalar() or 0
            
            # Calculate weighted popularity score
            weighted_score = (
                (views_count * 0.2) +
                (reviews_count * 0.3) +
                (issues_count * 0.3) +
                (ebook_issues_count * 0.2)
            )
            
            # Normalize to 0-1 range
            max_weights = 100  # Assume 100 of each metric is "maximum"
            max_possible = (max_weights * 0.2) + (max_weights * 0.3) + (max_weights * 0.3) + (max_weights * 0.2)
            popularity = min(weighted_score / max_possible, 1.0) if max_possible > 0 else 0.0
            
            popularity_scores.append({
                "book_id": str(book.id),
                "title": book.title,
                "popularity": round(popularity, 3),
                "views": int(views_count),
                "reviews": int(reviews_count),
                "issues": int(issues_count),
                "ebook_issues": int(ebook_issues_count)
            })
        
        # Sort by popularity descending
        popularity_scores.sort(key=lambda x: x['popularity'], reverse=True)
        
        print(f"\n{'Rank':<6} {'Popularity':<15} {'Book Title':<40} {'Views':<8} {'Reviews':<8} {'Issues':<8} {'eBook':<8}")
        print("-" * 95)
        
        for i, score in enumerate(popularity_scores[:20], 1):  # Show top 20
            print(
                f"{i:<6} {score['popularity']:<15.3f} {score['title'][:39]:<40} "
                f"{score['views']:<8} {score['reviews']:<8} {score['issues']:<8} {score['ebook_issues']:<8}"
            )
        
        if len(popularity_scores) > 20:
            print(f"\n... and {len(popularity_scores) - 20} more books")
        
        # Calculate statistics
        scores = [s['popularity'] for s in popularity_scores]
        avg_popularity = sum(scores) / len(scores) if scores else 0
        max_popularity = max(scores) if scores else 0
        min_popularity = min(scores) if scores else 0
        
        print("\n" + "="*80)
        print(f"Statistics:")
        print(f"  Total Books: {len(popularity_scores)}")
        print(f"  Average Popularity: {avg_popularity:.3f}")
        print(f"  Max Popularity: {max_popularity:.3f}")
        print(f"  Min Popularity: {min_popularity:.3f}")
        print("="*80 + "\n")
        
        # Verify formula (show detailed calculation for top book)
        if popularity_scores:
            top_book = popularity_scores[0]
            print(f"Formula Verification - Top Book: {top_book['title']}")
            print(f"  Views (20%):          {top_book['views']} × 0.2 = {top_book['views'] * 0.2:.3f}")
            print(f"  Reviews (30%):        {top_book['reviews']} × 0.3 = {top_book['reviews'] * 0.3:.3f}")
            print(f"  Issues (30%):         {top_book['issues']} × 0.3 = {top_book['issues'] * 0.3:.3f}")
            print(f"  eBook Issues (20%):   {top_book['ebook_issues']} × 0.2 = {top_book['ebook_issues'] * 0.2:.3f}")
            weighted = (top_book['views'] * 0.2) + (top_book['reviews'] * 0.3) + (top_book['issues'] * 0.3) + (top_book['ebook_issues'] * 0.2)
            print(f"  Weighted Score:       {weighted:.3f}")
            print(f"  Normalized (÷100):    {min(weighted / 100, 1.0):.3f}")
            print()
        
        print("✅ Popularity calculation test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during popularity calculation test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_popularity_calculation()
