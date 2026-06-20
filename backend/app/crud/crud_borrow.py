from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from typing import List, Optional

from ..models.borrow_record import BorrowRecord
from ..schemas.borrow_record import BorrowRecordCreate

def get_borrow_record(db: Session, record_id: str) -> Optional[BorrowRecord]:
    return db.query(BorrowRecord).filter(BorrowRecord.id == record_id).first()

def get_user_borrow_records(db: Session, user_id: str) -> List[BorrowRecord]:
    records = db.query(BorrowRecord).filter(BorrowRecord.user_id == user_id).all()
    return [r.to_dict() for r in records]

def get_book_borrow_records(db: Session, book_id: str) -> List[BorrowRecord]:
    records = db.query(BorrowRecord).filter(BorrowRecord.book_id == book_id).all()
    return [r.to_dict() for r in records]

def get_active_borrows(db: Session) -> List[BorrowRecord]:
    records = db.query(BorrowRecord).filter(
        BorrowRecord.status.in_( ["borrowed", "overdue"] )
    ).all()
    return [r.to_dict() for r in records]


def get_all_borrows(db: Session) -> List[BorrowRecord]:
    records = db.query(BorrowRecord).order_by(BorrowRecord.borrowed_at.desc()).all()
    return [r.to_dict() for r in records]

def create_borrow_record(db: Session, record: BorrowRecordCreate) -> BorrowRecord:
    record_dict = record.dict()
    # Convert string IDs to UUIDs for the database
    # Accept either uuid.UUID objects or strings
    try:
        if isinstance(record_dict.get('user_id'), uuid.UUID):
            record_dict['user_id'] = record_dict['user_id']
        else:
            record_dict['user_id'] = uuid.UUID(str(record_dict['user_id']))
    except Exception:
        record_dict['user_id'] = uuid.UUID(str(record_dict['user_id']))
    try:
        if isinstance(record_dict.get('book_id'), uuid.UUID):
            record_dict['book_id'] = record_dict['book_id']
        else:
            record_dict['book_id'] = uuid.UUID(str(record_dict['book_id']))
    except Exception:
        record_dict['book_id'] = uuid.UUID(str(record_dict['book_id']))
    # Ensure borrowed_at is set explicitly so frontend can display issue_date
    record_dict.setdefault('borrowed_at', datetime.utcnow())
    
    db_record = BorrowRecord(
        id=uuid.uuid4(),
        **record_dict
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record.to_dict()


def issue_book(db: Session, book_id: str, user_id: str, days: int = 14) -> Optional[dict]:
    """Issue a book to a user: validate availability, decrement book count, and create borrow record."""
    from .crud_book import get_book
    try:
        # ensure proper UUID strings
        book = get_book(db, uuid.UUID(book_id)) if isinstance(book_id, str) else get_book(db, book_id)
    except Exception:
        book = get_book(db, book_id)

    if not book:
        raise ValueError('Book not found')
    if not getattr(book, 'available_copies', 0) or book.available_copies <= 0:
        raise ValueError('No copies available')

    # decrement and commit the book update before creating borrow
    book.available_copies = (book.available_copies or 0) - 1
    if book.available_copies <= 0:
        book.status = 'reserved'
    else:
        book.status = 'available'
    db.add(book)
    db.commit()

    # create borrow record using existing helper
    br_payload = BorrowRecordCreate(
        user_id=str(user_id),
        book_id=str(book.id),
        due_date=datetime.utcnow() + timedelta(days=days),
        status='borrowed'
    )
    rec = create_borrow_record(db, br_payload)
    return rec

def return_book(db: Session, record_id: str) -> Optional[BorrowRecord]:
    db_record = get_borrow_record(db, record_id)
    if db_record:
        db_record.returned_at = datetime.utcnow()
        db_record.status = "returned"
        db.commit()
        db.refresh(db_record)
    return db_record.to_dict() if db_record else None


def extend_due_date(db: Session, record_id: str, days: int) -> Optional[BorrowRecord]:
    db_record = get_borrow_record(db, record_id)
    if not db_record:
        return None
    if db_record.status == "returned":
        # cannot extend a returned book
        return None
    # extend the due date
    db_record.due_date = db_record.due_date + timedelta(days=days)
    db.commit()
    db.refresh(db_record)
    return db_record.to_dict()

def update_overdue_status(db: Session) -> int:
    """Update status to overdue for books past their due date"""
    now = datetime.utcnow()
    result = db.query(BorrowRecord).filter(
        BorrowRecord.status == "borrowed",
        BorrowRecord.due_date < now,
    ).update({"status": "overdue"})
    db.commit()
    return result