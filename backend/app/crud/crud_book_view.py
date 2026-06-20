from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime
import uuid

from ..models.book_view import BookView


def create_view(db: Session, user_id: str, book_id: str, session_id: Optional[str] = None) -> dict:
    """Record a book view for a user."""
    try:
        view = BookView(
            id=str(uuid.uuid4()),
            user_id=user_id,
            book_id=book_id,
            viewed_at=datetime.utcnow(),
            session_id=session_id
        )
        db.add(view)
        db.commit()
        db.refresh(view)
        return view.to_dict()
    except Exception as e:
        db.rollback()
        raise e


def get_book_view_count(db: Session, book_id: str) -> int:
    """Get the total number of views for a specific book."""
    try:
        count = db.query(func.count(BookView.id)).filter(BookView.book_id == book_id).scalar()
        return count or 0
    except Exception as e:
        print(f"Error getting view count for book {book_id}: {e}")
        return 0


def get_total_views(db: Session) -> int:
    """Get the total number of views across all books."""
    try:
        count = db.query(func.count(BookView.id)).scalar()
        return count or 0
    except Exception as e:
        print(f"Error getting total views: {e}")
        return 0


def get_book_views(db: Session, book_id: str, limit: int = 50, offset: int = 0) -> list:
    """Get views for a specific book with pagination."""
    try:
        views = db.query(BookView).filter(BookView.book_id == book_id).order_by(BookView.viewed_at.desc()).offset(offset).limit(limit).all()
        return [v.to_dict() for v in views]
    except Exception as e:
        print(f"Error getting views for book {book_id}: {e}")
        return []


def get_user_views(db: Session, user_id: str, limit: int = 50, offset: int = 0) -> list:
    """Get all views by a specific user."""
    try:
        views = db.query(BookView).filter(BookView.user_id == user_id).order_by(BookView.viewed_at.desc()).offset(offset).limit(limit).all()
        return [v.to_dict() for v in views]
    except Exception as e:
        print(f"Error getting views for user {user_id}: {e}")
        return []


def get_views_by_date_range(db: Session, book_id: str, start_date: datetime, end_date: datetime) -> list:
    """Get views for a book within a date range."""
    try:
        views = db.query(BookView).filter(
            BookView.book_id == book_id,
            BookView.viewed_at >= start_date,
            BookView.viewed_at <= end_date
        ).order_by(BookView.viewed_at.desc()).all()
        return [v.to_dict() for v in views]
    except Exception as e:
        print(f"Error getting views by date range for book {book_id}: {e}")
        return []


def get_views_summary(db: Session, book_id: str) -> dict:
    """Get a summary of views for a book."""
    try:
        total_views = get_book_view_count(db, book_id)
        
        # Get unique users who viewed
        unique_users = db.query(func.count(func.distinct(BookView.user_id))).filter(BookView.book_id == book_id).scalar() or 0
        
        # Get most recent view
        latest_view = db.query(BookView).filter(BookView.book_id == book_id).order_by(BookView.viewed_at.desc()).first()
        
        return {
            "book_id": book_id,
            "total_views": total_views,
            "unique_users": unique_users,
            "last_viewed": latest_view.viewed_at.isoformat() if latest_view else None
        }
    except Exception as e:
        print(f"Error getting views summary for book {book_id}: {e}")
        return {
            "book_id": book_id,
            "total_views": 0,
            "unique_users": 0,
            "last_viewed": None
        }
