from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import func
from pydantic import BaseModel
from ..models.book_view import BookView

from ..core.database import get_db
from ..routes.auth import get_current_user
from ..crud import crud_book_view

router = APIRouter(prefix="/book-views", tags=["book_views"])


# Pydantic model for request body
class RecordViewRequest(BaseModel):
    book_id: str
    session_id: Optional[str] = None


@router.post("/")
def record_view(
    request: RecordViewRequest,
    db: Session = Depends(get_db),
    token=Depends(get_current_user)
):
    """Record a view for a book by the current user."""
    try:
        user_id = token.user_id
        view = crud_book_view.create_view(db, user_id, request.book_id, request.session_id)
        return {
            "status": "success",
            "data": view,
            "message": "View recorded successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record view: {str(e)}"
        )


@router.get("/book/{book_id}/count")
def get_book_view_count(
    book_id: str,
    db: Session = Depends(get_db)
):
    """Get the total number of views for a specific book."""
    try:
        count = crud_book_view.get_book_view_count(db, book_id)
        return {
            "book_id": book_id,
            "total_views": count
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get view count: {str(e)}"
        )


@router.get("/book/{book_id}")
def get_book_views(
    book_id: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get views for a specific book with pagination."""
    try:
        views = crud_book_view.get_book_views(db, book_id, limit=limit, offset=offset)
        count = crud_book_view.get_book_view_count(db, book_id)
        return {
            "book_id": book_id,
            "total_views": count,
            "limit": limit,
            "offset": offset,
            "data": views
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get views: {str(e)}"
        )


@router.get("/book/{book_id}/summary")
def get_views_summary(
    book_id: str,
    db: Session = Depends(get_db)
):
    """Get a summary of views for a book."""
    try:
        summary = crud_book_view.get_views_summary(db, book_id)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get summary: {str(e)}"
        )


@router.get("/user/history")
def get_user_view_history(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    token=Depends(get_current_user)
):
    """Get view history for the current user."""
    try:
        user_id = token.user_id
        views = crud_book_view.get_user_views(db, user_id, limit=limit, offset=offset)
        return {
            "user_id": user_id,
            "limit": limit,
            "offset": offset,
            "data": views
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user history: {str(e)}"
        )


@router.get("/stats")
def get_global_stats(db: Session = Depends(get_db)):
    """Get global statistics about book views."""
    try:
        total_views = crud_book_view.get_total_views(db)
        # Get count of unique books that have been viewed
        unique_books = db.query(func.count(func.distinct(BookView.book_id))).scalar() or 0
        return {
            "total_views": total_views,
            "unique_books": unique_books
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {str(e)}"
        )


@router.get("/all-books-views")
def get_all_books_views(db: Session = Depends(get_db)):
    """Get view counts for all books. Returns list of {book_id, total_views}."""
    try:
        # Query all book IDs with their view counts
        results = db.query(
            BookView.book_id,
            func.count(BookView.id).label('total_views')
        ).group_by(BookView.book_id).all()
        
        return [
            {
                "book_id": str(row[0]),
                "total_views": int(row[1])
            }
            for row in results
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get all books views: {str(e)}"
        )
