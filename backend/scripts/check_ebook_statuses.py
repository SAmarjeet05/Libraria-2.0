#!/usr/bin/env python3
"""
Check eBook issue statuses in the database
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.ebook_issue import EbookIssue
from sqlalchemy import func

def check_ebook_statuses():
    """Check the distribution of eBook issue statuses"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("EBOOK ISSUE STATUS DISTRIBUTION")
        print("="*80 + "\n")
        
        # Get status counts
        status_counts = db.query(
            EbookIssue.status,
            func.count(EbookIssue.id).label('count')
        ).group_by(EbookIssue.status).all()
        
        total = 0
        for status, count in status_counts:
            print(f"{status.upper():<15} {count:>5} issues")
            total += count
        
        print(f"{'-'*30}")
        print(f"{'TOTAL':<15} {total:>5} issues")
        
        # Active issues by book
        print("\n" + "="*80)
        print("ACTIVE EBOOK ISSUES BY BOOK")
        print("="*80 + "\n")
        
        from app.models.book import Book
        
        active_by_book = db.query(
            Book.title,
            func.count(EbookIssue.id).label('active_count')
        ).join(
            EbookIssue, EbookIssue.book_id == Book.id
        ).filter(
            EbookIssue.status == 'active'
        ).group_by(
            Book.id, Book.title
        ).order_by(
            func.count(EbookIssue.id).desc()
        ).all()
        
        if active_by_book:
            print(f"{'Book Title':<45} {'Active Issues':>15}")
            print("-" * 62)
            for title, count in active_by_book:
                print(f"{title[:44]:<45} {count:>15}")
        else:
            print("No active eBook issues found")
        
        print("\n" + "="*80 + "\n")
        print("✅ eBook issue status check completed!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_ebook_statuses()
