from sqlalchemy import Column, DateTime, String, Text, Enum, ForeignKey
from datetime import datetime
import uuid

from .base import Base
from ..core.custom_types import SQLiteUUID


class EbookIssue(Base):
    __tablename__ = "ebook_issues"

    id = Column(SQLiteUUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(SQLiteUUID, ForeignKey("users.id"), nullable=False)
    book_id = Column(SQLiteUUID, ForeignKey("books.id"), nullable=False)
    issued_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)
    status = Column(Enum('active', 'expired', 'revoked', name='ebook_issue_status'), nullable=False, default='active')

    def to_dict(self):
        return {
            "id": str(self.id) if self.id else None,
            "user_id": str(self.user_id) if self.user_id else None,
            "book_id": str(self.book_id) if self.book_id else None,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "status": self.status,
        }


from sqlalchemy import event


@event.listens_for(EbookIssue, 'load')
def receive_load(target, context):
    target.id = str(target.id) if target.id else None
    target.user_id = str(target.user_id) if target.user_id else None
    target.book_id = str(target.book_id) if target.book_id else None
