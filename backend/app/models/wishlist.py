from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from app.core.database import Base


class Wishlist(Base):
    __tablename__ = "wishlist"

    # integer autoincrement primary key as requested
    id = Column(Integer, primary_key=True, autoincrement=True)

    # store user and book identifiers as strings to match existing UUID ids used by users/books
    user_id = Column(String, nullable=False, index=True)
    book_id = Column(String, nullable=False, index=True)

    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String, nullable=False, default="active")
    notes = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": int(self.id) if self.id is not None else None,
            "user_id": self.user_id,
            "book_id": self.book_id,
            "added_at": self.added_at.isoformat() if self.added_at else None,
            "status": self.status,
            "notes": self.notes,
        }
