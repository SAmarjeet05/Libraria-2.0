from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Enum
import enum

from .base import Base
from ..core.custom_types import SQLiteUUID


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    GRANTED = "granted"
    REJECTED = "rejected"


class BookRequest(Base):
    __tablename__ = "book_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(SQLiteUUID, ForeignKey("users.id"), nullable=False)
    book_id = Column(SQLiteUUID, ForeignKey("books.id"), nullable=True)
    status = Column(Enum(RequestStatus), nullable=False, default=RequestStatus.PENDING)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": str(self.user_id) if self.user_id else None,
            "book_id": str(self.book_id) if self.book_id else None,
            "status": self.status.value if hasattr(self.status, 'value') else str(self.status),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
