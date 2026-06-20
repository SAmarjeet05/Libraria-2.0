from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from ..models.book import Book
from ..models.book_view import BookView
from ..models.book_review import BookReview
from ..models.borrow_record import BorrowRecord
from ..models.ebook_issue import EbookIssue
from ..models.book_request import BookRequest
from ..models.wishlist import Wishlist
from ..models.book_popularity_cache import BookPopularityCache


def get_user_interaction_categories(db: Session, user_id: str):
    """
    Analyze user's interactions to determine interested categories.
    Looks at: borrowed books, ebook issues, requests, wishlist
    """
    categories = set()
    
    # Get categories from borrowed books
    borrowed = db.query(Book.category_id).join(
        BorrowRecord, BorrowRecord.book_id == Book.id
    ).filter(BorrowRecord.user_id == user_id).distinct().all()
    categories.update([cat[0] for cat in borrowed if cat[0]])
    
    # Get categories from ebook issues
    ebook_accessed = db.query(Book.category_id).join(
        EbookIssue, EbookIssue.book_id == Book.id
    ).filter(EbookIssue.user_id == user_id).distinct().all()
    categories.update([cat[0] for cat in ebook_accessed if cat[0]])
    
    # Get categories from wishlist
    wishlisted = db.query(Book.category_id).join(
        Wishlist, Wishlist.book_id == Book.id
    ).filter(Wishlist.user_id == user_id).distinct().all()
    categories.update([cat[0] for cat in wishlisted if cat[0]])
    
    # Get categories from book requests
    requested = db.query(Book.category_id).join(
        BookRequest, BookRequest.book_id == Book.id
    ).filter(BookRequest.user_id == user_id).distinct().all()
    categories.update([cat[0] for cat in requested if cat[0]])
    
    return list(categories)


def get_user_read_books(db: Session, user_id: str):
    """Get all books the user has already borrowed/accessed"""
    read_books = db.query(Book.id).join(
        BorrowRecord, BorrowRecord.book_id == Book.id
    ).filter(BorrowRecord.user_id == user_id).union(
        db.query(Book.id).join(
            EbookIssue, EbookIssue.book_id == Book.id
        ).filter(EbookIssue.user_id == user_id)
    ).all()
    
    return [str(book[0]) for book in read_books]


def get_user_activity_count(db: Session, user_id: str):
    """
    Get total count of user's library activities.
    Used to determine if user is new or has activity.
    """
    borrows = db.query(func.count(BorrowRecord.id)).filter(
        BorrowRecord.user_id == user_id
    ).scalar() or 0
    
    ebook_issues = db.query(func.count(EbookIssue.id)).filter(
        EbookIssue.user_id == user_id
    ).scalar() or 0
    
    wishlists = db.query(func.count(Wishlist.id)).filter(
        Wishlist.user_id == user_id
    ).scalar() or 0
    
    requests = db.query(func.count(BookRequest.id)).filter(
        BookRequest.user_id == user_id
    ).scalar() or 0
    
    views = db.query(func.count(BookView.id)).filter(
        BookView.user_id == user_id
    ).scalar() or 0
    
    return {
        "borrows": borrows,
        "ebook_issues": ebook_issues,
        "wishlists": wishlists,
        "requests": requests,
        "views": views,
        "total": borrows + ebook_issues + wishlists + requests + views
    }


def get_recommended_books(db: Session, user_id: str, limit: int = 8):
    """
    Get personalized recommended books for a user based on their interests.
    
    Algorithm:
    1. Get user's interested categories from past interactions
    2. Get books from those categories (excluding already read)
    3. Sort by popularity score (from cache)
    4. Return top N books
    
    If user has no activity, return empty list (no recommendations)
    """
    # Check user activity
    activity = get_user_activity_count(db, user_id)
    
    if activity["total"] == 0:
        # New user with no activity
        return {
            "recommendations": [],
            "reason": "new_user",
            "activity_count": 0
        }
    
    # Get interested categories
    category_ids = get_user_interaction_categories(db, user_id)
    
    if not category_ids:
        # User has activity but no categories (shouldn't happen)
        return {
            "recommendations": [],
            "reason": "no_categories",
            "activity_count": activity["total"]
        }
    
    # Get already read books
    read_books = get_user_read_books(db, user_id)
    
    # Get popular books from interested categories (excluding read ones)
    books = db.query(
        Book.id,
        Book.title,
        Book.author,
        Book.isbn,
        Book.cover_url,
        Book.category_id,
        Book.has_ebook,
        Book.status,
        BookPopularityCache.popularity_score
    ).outerjoin(
        BookPopularityCache, BookPopularityCache.book_id == Book.id
    ).filter(
        and_(
            Book.category_id.in_(category_ids),
            Book.id.notin_(read_books),
            Book.status == 'available'
        )
    ).order_by(
        BookPopularityCache.popularity_score.desc()
    ).limit(limit).all()
    
    if not books:
        # No recommendations found
        return {
            "recommendations": [],
            "reason": "no_books_in_categories",
            "activity_count": activity["total"]
        }
    
    # Format response
    recommendations = []
    for book in books:
        recommendations.append({
            "id": str(book.id),
            "title": book.title,
            "author": book.author,
            "isbn": book.isbn,
            "cover_url": book.cover_url if book.cover_url and book.cover_url.strip() and book.cover_url.lower() != 'null' else None,
            "category_id": book.category_id,
            "has_ebook": book.has_ebook,
            "status": book.status,
            "popularity": round(book.popularity_score, 3) if book.popularity_score else 0.0
        })
    
    return {
        "recommendations": recommendations,
        "reason": "success",
        "activity_count": activity["total"],
        "interested_categories": len(category_ids),
        "activity_breakdown": activity
    }
