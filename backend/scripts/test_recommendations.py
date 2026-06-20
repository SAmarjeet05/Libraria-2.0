#!/usr/bin/env python3
"""
Test script for personalized book recommendations
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.crud import crud_recommendations
from app.models.user import User
from app.models.borrow_record import BorrowRecord
from app.models.ebook_issue import EbookIssue
from app.models.wishlist import Wishlist
from app.models.book_request import BookRequest
from app.models.book import Book

def test_recommendations():
    """Test the recommendation system"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("RECOMMENDATION SYSTEM TEST")
        print("="*80 + "\n")
        
        # Get all users
        users = db.query(User).limit(5).all()
        
        if not users:
            print("⚠️  No users found in database")
            return
        
        for user in users:
            print(f"\nUser: {user.full_name or user.username} (ID: {user.id})")
            print("-" * 80)
            
            # Get user activity
            activity = crud_recommendations.get_user_activity_count(db, str(user.id))
            print(f"Activity Breakdown:")
            print(f"  - Borrows: {activity['borrows']}")
            print(f"  - eBook Issues: {activity['ebook_issues']}")
            print(f"  - Wishlists: {activity['wishlists']}")
            print(f"  - Requests: {activity['requests']}")
            print(f"  - Views: {activity['views']}")
            print(f"  - Total: {activity['total']}")
            
            if activity['total'] == 0:
                print(f"  → No activity - Would show 'No Recent Activity'")
                continue
            
            # Get interested categories
            categories = crud_recommendations.get_user_interaction_categories(db, str(user.id))
            print(f"\nInterested Categories: {len(categories)}")
            
            if categories:
                category_names = db.query(Book.category_id).filter(
                    Book.category_id.in_(categories)
                ).distinct().all()
                print(f"  Categories: {categories}")
            
            # Get recommendations
            result = crud_recommendations.get_recommended_books(db, str(user.id), limit=5)
            
            print(f"\nRecommendation Status: {result['reason']}")
            print(f"Recommendations Found: {len(result['recommendations'])}")
            
            if result['recommendations']:
                print(f"\nTop Recommendations:")
                for i, book in enumerate(result['recommendations'], 1):
                    print(f"  {i}. {book['title']}")
                    print(f"     Author: {book['author']}")
                    print(f"     Popularity: {book['popularity']:.3f}")
            
            print()
        
        print("="*80)
        print("✅ Recommendation system test completed successfully!")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_recommendations()
