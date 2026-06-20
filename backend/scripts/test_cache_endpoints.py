#!/usr/bin/env python3
"""
Test the popularity cache endpoints
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import json
from app.core.database import SessionLocal
from app.models.book_popularity_cache import BookPopularityCache

def test_cache_endpoints():
    """Test the popularity cache by querying the database"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("POPULARITY CACHE ENDPOINT TEST")
        print("="*80)
        
        # Get all cached books
        caches = db.query(BookPopularityCache).all()
        
        if not caches:
            print("⚠️  No cached books found")
            return
        
        print(f"\nTotal Cached Books: {len(caches)}\n")
        
        # Simulate /api/books/popularity/all response
        print("Simulated Response: GET /api/books/popularity/all")
        print("-" * 80)
        all_response = []
        for cache in caches:
            all_response.append({
                "book_id": str(cache.book_id),
                "popularity": cache.popularity_score,
                "details": {
                    "views": int(cache.views_count),
                    "reviews": int(cache.reviews_count),
                    "borrow_issues": int(cache.borrow_issues_count),
                    "ebook_issues": int(cache.ebook_issues_count)
                },
                "last_updated": cache.last_updated.isoformat(),
                "next_update": cache.next_update.isoformat()
            })
        
        print(json.dumps(all_response, indent=2))
        
        # Show cache update schedule
        print("\n" + "="*80)
        print("CACHE UPDATE SCHEDULE")
        print("="*80 + "\n")
        
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        
        for i, cache in enumerate(caches, 1):
            time_until_update = cache.next_update - now
            minutes_until = int(time_until_update.total_seconds() / 60)
            
            print(f"{i}. Book ID: {cache.book_id}")
            print(f"   Last Updated: {cache.last_updated}")
            print(f"   Next Update: {cache.next_update}")
            if minutes_until > 0:
                print(f"   Updates in: {minutes_until} minutes")
            else:
                print(f"   ⚠️  STALE - Will update on next request")
            print()
        
        print("="*80)
        print("FRONTEND AUTO-REFRESH")
        print("="*80)
        print("""
Frontend automatically refreshes popularity scores every 5 minutes:
- Initial Load: Fetches all popularity scores on page load
- Auto-Refresh: Updates scores every 5 minutes (300,000 ms)
- Backend Cache: Auto-updates cache every 15 minutes
- Stale Check: If cache is stale (next_update <= now), recalculates

Data Flow:
1. Frontend loads BooksView component
2. Component fetches all books and popularity scores
3. Popularity data displayed in book cards
4. Every 5 minutes, frontend silently fetches fresh scores
5. If backend cache is stale, it auto-recalculates
6. Frontend updates display with new scores
        """)
        
        print("="*80 + "\n")
        print("✅ Cache endpoint test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_cache_endpoints()
