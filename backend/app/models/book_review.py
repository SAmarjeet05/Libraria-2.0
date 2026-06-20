from sqlalchemy import Column, DateTime, Text, Integer, String
from datetime import datetime

from .base import Base


class BookReview(Base):
    __tablename__ = "book_reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), nullable=False)
    book_id = Column(String(36), nullable=False)
    rating = Column(Integer, nullable=False, default=0)
    review_text = Column(Text, nullable=True)
    upvotes = Column(Integer, nullable=False, default=0)
    downvotes = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id) if self.id else None,
            "user_id": str(self.user_id) if self.user_id else None,
            "book_id": str(self.book_id) if self.book_id else None,
            "rating": int(self.rating) if self.rating is not None else None,
            "review_text": self.review_text,
            "upvotes": int(self.upvotes or 0),
            "downvotes": int(self.downvotes or 0),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
