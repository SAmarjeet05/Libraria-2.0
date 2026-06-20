from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from uuid import UUID
import logging
import time
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)

from ..core.database import get_db
from ..crud import crud_book, crud_book_view
from ..crud import crud_book_popularity_cache
from ..schemas.book import Book, BookCreate, BookUpdate
from ..schemas.token import TokenPayload
from ..routes.auth import get_current_user
from ..models.book_review import BookReview
from ..models.borrow_record import BorrowRecord
from ..models.ebook_issue import EbookIssue
from ..models.book_view import BookView
from fastapi import UploadFile, File, Request
import tempfile
import os
import shutil
from ..routes.notes import run_mega_cmd

router = APIRouter(prefix="/books", tags=["books"])

@router.get("/")
def get_books(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return crud_book.get_books(db, skip=skip, limit=limit)

@router.get('/proxy-mega')
async def books_proxy_mega(request: Request, url: str, db: Session = Depends(get_db)):
    """Proxy MEGA-hosted ebook files using the same logic as notes.proxy-mega.

    This delegates to `app.routes.notes.proxy_mega_pdf` so ebooks behave
    identically to notes when streaming MEGA files to the browser.
    """
    try:
        # import lazily to avoid circular imports at module-import time
        from app.routes.notes import proxy_mega_pdf
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy not available: {e}")

    return await proxy_mega_pdf(request, url, db)

@router.get("/{book_id}", response_model=Book)
def get_book(book_id: str, db: Session = Depends(get_db)):
    try:
        # Format the UUID string if needed (add hyphens)
        if len(book_id) == 32:
            book_id = f"{book_id[:8]}-{book_id[8:12]}-{book_id[12:16]}-{book_id[16:20]}-{book_id[20:]}"
        
        # Convert string ID to UUID
        try:
            book_uuid = UUID(book_id)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid book ID format - must be a valid UUID"
            )

        db_book = crud_book.get_book(db, book_uuid)
        if not db_book:
            raise HTTPException(
                status_code=404,
                detail="Book not found"
            )
        return db_book
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/", response_model=Book)
async def create_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    logger = logging.getLogger(__name__)
    try:
        logger.info(f"Attempting to create book. User: {current_user}")
        logger.info(f"Received book data: {book.dict()}")
        
        if not current_user or not current_user.is_admin:
            logger.error(f"Authorization failed. User is not admin: {current_user}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized - admin privileges required"
            )
        
        db_book = crud_book.get_book_by_isbn(db, book.isbn)
        if db_book:
            logger.warning(f"ISBN already exists: {book.isbn}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ISBN already registered"
            )
        
        logger.info("Creating new book...")
        result = crud_book.create_book(db, book)
        logger.info(f"Book created successfully: {result}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating book: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating book: {str(e)}"
        )

@router.put("/{book_id}", response_model=Book)
def update_book(
    book_id: UUID,
    book: BookUpdate,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_book = crud_book.update_book(db, book_id, book)
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    return db_book

@router.delete("/{book_id}")
def delete_book(
    book_id: UUID,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not crud_book.delete_book(db, book_id):
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": "Book deleted successfully"}


@router.post('/upload-ebook')
async def upload_ebook(file: UploadFile = File(...), current_user: TokenPayload = Depends(get_current_user)):
    """Admin-only endpoint: upload an e-book file to MEGA under /libraria_books/{user_id}/ and return public link."""
    if not current_user or not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Admin only")

    # read bytes
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {e}")

    filename = file.filename or f"ebook-{int(time.time())}"
    tmp_dir = tempfile.mkdtemp()
    local_path = os.path.join(tmp_dir, filename)
    try:
        with open(local_path, 'wb') as f:
            f.write(contents)

        user_id = getattr(current_user, 'user_id', None) or 'anonymous'
        folder = f"/libraria_books/{user_id}/"

        # ensure folder exists and upload
        try:
            run_mega_cmd('mega-mkdir', ['-p', folder])
            run_mega_cmd('mega-put', [local_path, folder])
            out = run_mega_cmd('mega-export', ['-a', folder + filename])
            link = out.split()[-1]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"MEGA upload failed: {e}")

        return { 'mega_public_link': link, 'mega_path': folder + filename }
    finally:
        try:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        except Exception:
            pass


def calculate_book_popularity(db: Session, book_id: str):
    """
    Calculate popularity score for a single book.
    Returns dict with popularity_score and component counts.
    
    Weighted factors:
    - Views (20%): How many times the book was viewed
    - Reviews (30%): How many reviews (more engagement)
    - Borrow Issues (30%): How many times borrowed (actual circulation)
    - eBook Issues (20%): How many times accessed as ebook (ACTIVE ONLY)
    """
    # Count views
    views_count = db.query(func.count(BookView.id)).filter(BookView.book_id == str(book_id)).scalar() or 0
    
    # Count reviews
    reviews_count = db.query(func.count(BookReview.id)).filter(BookReview.book_id == str(book_id)).scalar() or 0
    
    # Count borrow issues
    issues_count = db.query(func.count(BorrowRecord.id)).filter(BorrowRecord.book_id == book_id).scalar() or 0
    
    # Count ONLY ACTIVE ebook issues (exclude revoked and expired)
    ebook_issues_count = db.query(func.count(EbookIssue.id)).filter(
        EbookIssue.book_id == str(book_id),
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
    
    return {
        "popularity": round(popularity, 3),
        "views": int(views_count),
        "reviews": int(reviews_count),
        "issues": int(issues_count),
        "ebook_issues": int(ebook_issues_count)
    }


@router.get("/popularity/all")
def get_all_books_popularity(db: Session = Depends(get_db)):
    """
    Get popularity scores for all books from cache.
    Cache updates every 15 minutes automatically.
    Returns cached values with last update time.
    """
    try:
        from ..models.book import Book
        
        # Get all books
        books = db.query(Book).all()
        
        if not books:
            return []
        
        popularity_scores = []
        now = datetime.utcnow()
        
        for book in books:
            # Try to get from cache first
            cache = crud_book_popularity_cache.get_popularity_cache(db, str(book.id))
            
            # If cache doesn't exist or is stale, calculate and update
            if not cache or cache.next_update <= now:
                calc_result = calculate_book_popularity(db, str(book.id))
                cache = crud_book_popularity_cache.create_or_update_popularity_cache(
                    db,
                    str(book.id),
                    calc_result["popularity"],
                    calc_result["views"],
                    calc_result["reviews"],
                    calc_result["issues"],
                    calc_result["ebook_issues"]
                )
            
            # Return cached values
            popularity_scores.append({
                "book_id": str(book.id),
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
        
        return popularity_scores
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get popularity scores: {str(e)}"
        )


@router.get("/{book_id}/popularity")
def get_book_popularity(book_id: str, db: Session = Depends(get_db)):
    """Get popularity score for a specific book from cache."""
    try:
        # Try to get from cache first
        cache = crud_book_popularity_cache.get_popularity_cache(db, book_id)
        now = datetime.utcnow()
        
        # If cache doesn't exist or is stale, calculate and update
        if not cache or cache.next_update <= now:
            calc_result = calculate_book_popularity(db, book_id)
            cache = crud_book_popularity_cache.create_or_update_popularity_cache(
                db,
                book_id,
                calc_result["popularity"],
                calc_result["views"],
                calc_result["reviews"],
                calc_result["issues"],
                calc_result["ebook_issues"]
            )
        
        # If still no cache, return zero popularity
        if not cache:
            return {
                "book_id": book_id,
                "popularity": 0.0,
                "details": {
                    "views": 0,
                    "reviews": 0,
                    "borrow_issues": 0,
                    "ebook_issues": 0
                },
                "last_updated": now.isoformat(),
                "next_update": now.isoformat()
            }
        
        return {
            "book_id": book_id,
            "popularity": cache.popularity_score,
            "details": {
                "views": int(cache.views_count),
                "reviews": int(cache.reviews_count),
                "borrow_issues": int(cache.borrow_issues_count),
                "ebook_issues": int(cache.ebook_issues_count)
            },
            "last_updated": cache.last_updated.isoformat(),
            "next_update": cache.next_update.isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate popularity: {str(e)}"
        )



