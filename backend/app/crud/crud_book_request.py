from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.book_request import BookRequest
from ..schemas.book_request import BookRequestCreate
import uuid
from ..models.book import Book
from ..models.ebook_issue import EbookIssue
from datetime import datetime, timedelta
from ..models.borrow_record import BorrowRecord, BorrowStatus
from . import crud_borrow
from ..schemas.borrow_record import BorrowRecordCreate
import logging
from ..models.book_request import RequestStatus

logger = logging.getLogger(__name__)


def create_request(db: Session, req_in: BookRequestCreate, user_id: str) -> dict:
    # If the user already has an active borrow or ebook issue for this book,
    # do not allow creating a duplicate request.
    try:
        u_id = uuid.UUID(user_id) if user_id else None
    except Exception:
        u_id = None
    try:
        b_id = uuid.UUID(req_in.book_id) if getattr(req_in, 'book_id', None) else None
    except Exception:
        b_id = None

    if u_id and b_id:
        try:
            # check active ebook issues
            existing_issue = db.query(EbookIssue).filter(
                EbookIssue.user_id == u_id,
                EbookIssue.book_id == b_id,
                EbookIssue.status == 'active'
            ).first()
            if existing_issue:
                raise ValueError('User already has this book issued')
        except Exception:
            # if DB check fails, continue to attempt to create request (fail-open)
            pass
        try:
            # check active borrow records
            existing_borrow = db.query(BorrowRecord).filter(
                BorrowRecord.user_id == u_id,
                BorrowRecord.book_id == b_id,
                BorrowRecord.status == BorrowStatus.BORROWED
            ).first()
            if existing_borrow:
                raise ValueError('User already has this book issued')
        except Exception:
            # ignore DB errors here
            pass

    req = BookRequest(
        user_id=uuid.UUID(user_id) if user_id else None,
        book_id=uuid.UUID(req_in.book_id) if getattr(req_in, 'book_id', None) else None,
        status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req.to_dict()


def get_all_requests(db: Session) -> List[BookRequest]:
    return db.query(BookRequest).order_by(BookRequest.created_at.desc()).all()


def get_pending_requests(db: Session) -> List[BookRequest]:
    return db.query(BookRequest).filter(BookRequest.status == RequestStatus.PENDING).order_by(BookRequest.created_at.desc()).all()


def get_request(db: Session, request_id: int) -> Optional[BookRequest]:
    return db.query(BookRequest).filter(BookRequest.id == request_id).first()


def update_status(db: Session, request_id: int, status: str) -> Optional[dict]:
    req = db.query(BookRequest).filter(BookRequest.id == request_id).first()
    if not req:
        return None
    logger.info(f"update_status called for request_id={request_id} current_status={req.status} target_status={status}")
    # Normalize status to allowed values
    normalized = str(status).lower()
    if normalized in ("granted", "approved"):
        # Attempt to issue the book and decrement available copies
        # If no book_id present, simply grant the request
        if req.book_id:
            book = db.query(Book).filter(Book.id == req.book_id).first()
            logger.info(f"Found book for request {request_id}: id={getattr(book,'id',None)} has_ebook={getattr(book,'has_ebook',False)} available_copies={getattr(book,'available_copies',None)}")
            if not book:
                raise ValueError("Book not found")
            if not book.available_copies or book.available_copies <= 0:
                raise ValueError("No available copies for this book")

            # decrement available copies
            book.available_copies = max(0, (book.available_copies or 0) - 1)
            # update status of the book if needed
            if book.available_copies == 0:
                book.status = 'reserved'
            else:
                book.status = 'available'

            created_issue = None
            created_borrow = None
            # create an ebook_issue record if book has eBook
            # For ebooks, create an EbookIssue; for physical books, create a BorrowRecord
            if getattr(book, 'has_ebook', False):
                issue = EbookIssue(
                    id=uuid.uuid4(),
                    user_id=req.user_id,
                    book_id=req.book_id,
                    expiry_date=datetime.utcnow() + timedelta(days=7),
                    status='active'
                )
                db.add(issue)
                created_issue = issue
            else:
                # For physical books, use the centralized issue_book helper which
                # validates availability, decrements the book count and creates a borrow record.
                try:
                    logger.info(f'Issuing book for request {request_id}: book_id={repr(req.book_id)} user_id={repr(req.user_id)}')
                    created = crud_borrow.issue_book(db, str(req.book_id), str(req.user_id), days=14)
                    created_borrow = created
                    logger.info(f'Created borrow via crud_borrow.issue_book: {created.get("id") if isinstance(created, dict) else created}')
                except Exception as e:
                    logger.exception(f'Failed to issue book via crud_borrow.issue_book: {e}')

            db.add(book)

        req.status = "granted"
    elif normalized in ("rejected", "denied"):
        req.status = "rejected"
    else:
        req.status = normalized

    db.add(req)
    # flush to ensure newly added objects have PKs assigned before commit
    try:
        db.flush()
    except Exception:
        logger.exception('flush failed before commit')
    # log created IDs (if any)
    try:
        if 'created_issue' in locals() and created_issue is not None:
            logger.info(f'Created EbookIssue (pre-commit) id={getattr(created_issue, "id", None)}')
        if 'created_borrow' in locals() and created_borrow is not None:
            logger.info(f'Created BorrowRecord (pre-commit) id={getattr(created_borrow, "id", None)}')
        if req.book_id:
            b = db.query(Book).filter(Book.id == req.book_id).first()
            logger.info(f'Book after update (pre-commit): id={getattr(b, "id", None)} available_copies={getattr(b, "available_copies", None)}')
    except Exception:
        logger.exception('Error logging pre-commit state')

    db.commit()
    # refresh created/modified objects
    db.refresh(req)
    out = req.to_dict()
    # attach created issue/borrow info if present (convert to dicts)
    try:
        if 'created_issue' in locals() and created_issue is not None:
            try:
                db.refresh(created_issue)
                out['issue'] = created_issue.to_dict()
                logger.info(f'Created EbookIssue (post-commit) id={out["issue"].get("id")}')
            except Exception:
                logger.exception('Failed to refresh created_issue')
        if 'created_borrow' in locals() and created_borrow is not None:
            try:
                db.refresh(created_borrow)
                out['borrow'] = created_borrow.to_dict()
                logger.info(f'Created BorrowRecord (post-commit) id={out["borrow"].get("id")}')
            except Exception:
                logger.exception('Failed to refresh created_borrow')
        if req.book_id:
            # refresh book to get updated available_copies
            try:
                b = db.query(Book).filter(Book.id == req.book_id).first()
                if b:
                    out['available_copies'] = getattr(b, 'available_copies', None)
            except Exception:
                logger.exception('Failed to fetch book post-commit')
    except Exception:
        logger.exception('Error attaching created records to response')

    return out
