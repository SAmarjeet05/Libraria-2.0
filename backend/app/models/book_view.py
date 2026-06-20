from sqlalchemy import Column, String, DateTime, ForeignKey
from datetime import datetime
import uuid

from .base import Base
from ..core.custom_types import SQLiteUUID


class BookView(Base):
    __tablename__ = "book_views"

    id = Column(SQLiteUUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    book_id = Column(SQLiteUUID, ForeignKey("books.id"), nullable=False)
    viewed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    session_id = Column(String, nullable=True)  # Optional session tracking

    def to_dict(self):
        """Return a JSON-serializable representation of the book view."""
        return {
            "id": str(self.id) if self.id else None,
            "user_id": self.user_id,
            "book_id": str(self.book_id) if self.book_id else None,
            "viewed_at": self.viewed_at.isoformat() if self.viewed_at else None,
            "session_id": self.session_id
        }
