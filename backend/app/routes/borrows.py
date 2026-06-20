from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from uuid import UUID
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from ..core.database import get_db
from ..crud import crud_borrow, crud_book, crud_user
from ..schemas.borrow_record import BorrowRecord, BorrowRecordCreate
from ..schemas.token import TokenPayload
from ..routes.auth import get_current_user

router = APIRouter(prefix="/borrows", tags=["borrows"])

# Provide both with and without trailing slash to avoid 307 redirects which may
# drop Authorization headers in some clients. Both routes point to the same handler.
@router.get("", response_model=List[BorrowRecord])
async def get_all_borrows_no_slash(
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    return await get_all_borrows(db, current_user)
@router.get("/", response_model=List[BorrowRecord])
async def get_all_borrows(
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """Get all borrow records (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    # Return all borrow records (active, overdue, returned) so admin sees full history
    records = crud_borrow.get_all_borrows(db)
    return records

@router.post("/issue/{book_id}", response_model=BorrowRecord)
async def issue_book(
    book_id: str,
    user_id: str,
    days: int = 14,  # Default loan period
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """Issue a book to a user (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        logger.info(f"Attempting to issue book. Book ID: {book_id}, User ID: {user_id}, Days: {days}")
        # Format the UUID string if needed (add hyphens)
        if len(book_id) == 32:
            book_id = f"{book_id[:8]}-{book_id[8:12]}-{book_id[12:16]}-{book_id[16:20]}-{book_id[20:]}"
        book_uuid = UUID(book_id)
        logger.info(f"Formatted book UUID: {book_uuid}")
        
        if len(user_id) == 32:
            user_id = f"{user_id[:8]}-{user_id[8:12]}-{user_id[12:16]}-{user_id[16:20]}-{user_id[20:]}"
        user_uuid = UUID(user_id)
        logger.info(f"Formatted user UUID: {user_uuid}")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid UUID format"
        )
    
    # Check if book exists and is available
    book = crud_book.get_book(db, book_uuid)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies <= 0:
        raise HTTPException(status_code=400, detail="No copies available")
    
    # Check if user exists
    user = crud_user.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create borrow record
    borrow_data = BorrowRecordCreate(
        user_id=str(user_uuid),
        book_id=str(book_uuid),
        due_date=datetime.utcnow() + timedelta(days=days)
    )
    
    try:
        # Update book availability
        book.available_copies -= 1
        db.commit()
        
        record = crud_borrow.create_borrow_record(db, borrow_data)
        return record
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating borrow record: {str(e)}"
        )

@router.post("/return/{record_id}", response_model=BorrowRecord)
async def return_book(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """Return a borrowed book (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    record = crud_borrow.get_borrow_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Borrow record not found")
    
    if record.status == "returned":
        raise HTTPException(status_code=400, detail="Book already returned")
    
    # Update book availability
    book = crud_book.get_book(db, record.book_id)
    if book:
        book.available_copies += 1
        db.commit()
    
    record = crud_borrow.return_book(db, record_id)
    return record


@router.post("/extend/{record_id}", response_model=BorrowRecord)
async def extend_borrow(
    record_id: str,
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """Extend the due date of a borrow by `days` (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    record = crud_borrow.get_borrow_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Borrow record not found")

    updated = crud_borrow.extend_due_date(db, record_id, days)
    if not updated:
        raise HTTPException(status_code=400, detail="Could not extend due date")
    return updated

@router.get("/me", response_model=List[BorrowRecord])
async def get_current_user_borrows(
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """Get borrow records for the current logged-in user"""
    records = crud_borrow.get_user_borrow_records(db, str(current_user.user_id))
    return records

@router.get("/user/{user_id}", response_model=List[BorrowRecord])
async def get_user_borrows(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """Get borrow records for a specific user"""
    if not current_user.is_admin and str(current_user.user_id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    records = crud_borrow.get_user_borrow_records(db, user_id)
    return records