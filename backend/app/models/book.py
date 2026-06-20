from sqlalchemy import Column, String, Integer, Text, Enum, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .base import Base
from ..core.custom_types import SQLiteUUID

class Book(Base):
    __tablename__ = "books"

    id = Column(SQLiteUUID, primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    isbn = Column(String(20), unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    publisher = Column(String)
    publication_year = Column(Integer)
    description = Column(Text)
    cover_url = Column(Text)
    total_copies = Column(Integer, default=0)
    available_copies = Column(Integer)
    added_at = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum('available', 'reserved', 'removed', name='book_status'), default='available')
    has_ebook = Column(Boolean, default=False, nullable=False)
    ebook_url = Column(Text)
    location = Column(String, nullable=True, default='Main Library - Shelf A1')

    # Relationship to Category
    category = relationship("Category", foreign_keys=[category_id])

    def to_dict(self):
        """Return a JSON-serializable representation of the book."""
        category_dict = None
        if self.category:
            category_dict = {
                "id": self.category.id,
                "name": self.category.name,
                "description": self.category.description if hasattr(self.category, 'description') else None
            }
        
        return {
            "id": str(self.id) if self.id else None,
            "title": self.title,
            "author": self.author,
            "isbn": self.isbn,
            "category_id": int(self.category_id) if self.category_id is not None else None,
            "category": category_dict,
            "publisher": self.publisher,
            "publication_year": self.publication_year,
            "description": self.description,
            "cover_url": self.cover_url,
            "total_copies": self.total_copies,
            "available_copies": self.available_copies,
            "added_at": self.added_at.isoformat() if self.added_at else None,
            "status": self.status,
            "has_ebook": bool(self.has_ebook),
            "ebook_url": self.ebook_url
            ,"location": self.location
        }