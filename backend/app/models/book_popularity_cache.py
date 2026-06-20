from sqlalchemy import Column, DateTime, Float, String
from datetime import datetime
import uuid

from .base import Base
from ..core.custom_types import SQLiteUUID


class BookPopularityCache(Base):
    __tablename__ = "book_popularity_cache"

    id = Column(SQLiteUUID, primary_key=True, default=uuid.uuid4)
    book_id = Column(SQLiteUUID, nullable=False, unique=True, index=True)
    popularity_score = Column(Float, nullable=False, default=0.0)
    views_count = Column(String, nullable=False, default='0')
    reviews_count = Column(String, nullable=False, default='0')
    borrow_issues_count = Column(String, nullable=False, default='0')
    ebook_issues_count = Column(String, nullable=False, default='0')
    last_updated = Column(DateTime, nullable=False, default=datetime.utcnow)
    next_update = Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id) if self.id else None,
            "book_id": str(self.book_id) if self.book_id else None,
            "popularity_score": self.popularity_score,
            "views_count": int(self.views_count) if self.views_count else 0,
            "reviews_count": int(self.reviews_count) if self.reviews_count else 0,
            "borrow_issues_count": int(self.borrow_issues_count) if self.borrow_issues_count else 0,
            "ebook_issues_count": int(self.ebook_issues_count) if self.ebook_issues_count else 0,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "next_update": self.next_update.isoformat() if self.next_update else None,
        }
