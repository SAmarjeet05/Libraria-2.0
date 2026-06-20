from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models.book_popularity_cache import BookPopularityCache


def get_popularity_cache(db: Session, book_id: str):
    """Get cached popularity for a book"""
    return db.query(BookPopularityCache).filter(
        BookPopularityCache.book_id == book_id
    ).first()


def get_all_popularity_cache(db: Session):
    """Get all cached popularity scores"""
    return db.query(BookPopularityCache).all()


def create_or_update_popularity_cache(
    db: Session,
    book_id: str,
    popularity_score: float,
    views_count: int,
    reviews_count: int,
    borrow_issues_count: int,
    ebook_issues_count: int
):
    """Create or update popularity cache for a book"""
    cache = db.query(BookPopularityCache).filter(
        BookPopularityCache.book_id == book_id
    ).first()
    
    now = datetime.utcnow()
    next_update = now + timedelta(minutes=15)  # Update every 15 minutes
    
    if cache:
        cache.popularity_score = popularity_score
        cache.views_count = str(views_count)
        cache.reviews_count = str(reviews_count)
        cache.borrow_issues_count = str(borrow_issues_count)
        cache.ebook_issues_count = str(ebook_issues_count)
        cache.last_updated = now
        cache.next_update = next_update
    else:
        cache = BookPopularityCache(
            book_id=book_id,
            popularity_score=popularity_score,
            views_count=str(views_count),
            reviews_count=str(reviews_count),
            borrow_issues_count=str(borrow_issues_count),
            ebook_issues_count=str(ebook_issues_count),
            last_updated=now,
            next_update=next_update
        )
        db.add(cache)
    
    db.commit()
    return cache


def delete_popularity_cache(db: Session, book_id: str):
    """Delete popularity cache for a book"""
    db.query(BookPopularityCache).filter(
        BookPopularityCache.book_id == book_id
    ).delete()
    db.commit()


def clear_all_popularity_cache(db: Session):
    """Clear all popularity cache"""
    db.query(BookPopularityCache).delete()
    db.commit()


def get_stale_caches(db: Session):
    """Get popularity caches that need updating (next_update <= now)"""
    now = datetime.utcnow()
    return db.query(BookPopularityCache).filter(
        BookPopularityCache.next_update <= now
    ).all()
