from sqlalchemy.orm import Session
import uuid
from typing import List, Optional

from ..models.ebook_issue import EbookIssue
from ..schemas.ebook_issue import EbookIssueCreate
from datetime import datetime, timedelta


def get_ebook_issue(db: Session, issue_id: str) -> Optional[dict]:
    rec = db.query(EbookIssue).filter(EbookIssue.id == issue_id).first()
    return rec.to_dict() if rec else None


def get_user_ebook_issues(db: Session, user_id: str) -> List[dict]:
    records = db.query(EbookIssue).filter(EbookIssue.user_id == user_id).all()
    return [r.to_dict() for r in records]


def get_book_ebook_issues(db: Session, book_id: str) -> List[dict]:
    records = db.query(EbookIssue).filter(EbookIssue.book_id == book_id).all()
    return [r.to_dict() for r in records]


def get_all_ebook_issues(db: Session) -> List[dict]:
    records = db.query(EbookIssue).order_by(EbookIssue.issued_at.desc()).all()
    return [r.to_dict() for r in records]


def create_ebook_issue(db: Session, issue: EbookIssueCreate) -> dict:
    data = issue.dict()
    # If no expiry_date provided, default to 1 week from now
    if not data.get('expiry_date'):
        data['expiry_date'] = datetime.utcnow() + timedelta(days=7)

    # convert string UUIDs to uuid.UUID where necessary
    try:
        data['user_id'] = uuid.UUID(data['user_id'])
        data['book_id'] = uuid.UUID(data['book_id'])
    except Exception:
        # keep as-is; model will handle conversion
        pass

    # Check if this user already has an active issue for this book
    try:
        existing = db.query(EbookIssue).filter(
            EbookIssue.user_id == data['user_id'],
            EbookIssue.book_id == data['book_id'],
            EbookIssue.status == 'active'
        ).first()
    except Exception:
        existing = None

    if existing:
        # Signal the caller that the book is already issued to this user
        raise ValueError('Ebook already issued to this user')

    db_rec = EbookIssue(
        id=uuid.uuid4(),
        user_id=data['user_id'],
        book_id=data['book_id'],
        expiry_date=data.get('expiry_date'),
        status=data.get('status', 'active')
    )
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)
    return db_rec.to_dict()


def revoke_ebook_issue(db: Session, issue_id: str) -> Optional[dict]:
    rec = db.query(EbookIssue).filter(EbookIssue.id == issue_id).first()
    if not rec:
        return None
    rec.status = 'revoked'
    db.commit()
    db.refresh(rec)
    return rec.to_dict()
