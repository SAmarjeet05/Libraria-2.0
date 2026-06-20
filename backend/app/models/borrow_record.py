from sqlalchemy import Column, ForeignKey, DateTime, Enum, String, event
from sqlalchemy.orm import attributes, relationship
from datetime import datetime
import enum
import uuid

from .base import Base
from ..core.custom_types import SQLiteUUID

class BorrowStatus(str, enum.Enum):
    BORROWED = "borrowed"
    RETURNED = "returned"
    OVERDUE = "overdue"

class BorrowRecord(Base):
    __tablename__ = "borrow_records"

    id = Column(SQLiteUUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(SQLiteUUID, ForeignKey("users.id"), nullable=False)
    book_id = Column(SQLiteUUID, ForeignKey("books.id"), nullable=False)
    borrowed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    returned_at = Column(DateTime, nullable=True)
    status = Column(Enum(BorrowStatus), nullable=False, default=BorrowStatus.BORROWED)

    user = relationship("User", backref="borrow_records")
    book = relationship("Book", backref="borrow_records")

    def __init__(self, **kwargs):
        # Convert string UUIDs to UUID objects for database
        for field in ['id', 'user_id', 'book_id']:
            if field in kwargs and isinstance(kwargs[field], str):
                kwargs[field] = uuid.UUID(kwargs[field])
        super().__init__(**kwargs)
    
    def to_dict(self):
        """Convert model to dictionary with string UUIDs"""
        # Helper to format datetimes with millisecond precision (JavaScript-friendly)
        def _iso_ms(dt):
            if not dt:
                return None
            try:
                # Use strftime to get microseconds then truncate to milliseconds
                s = dt.strftime('%Y-%m-%dT%H:%M:%S.%f')
                # drop last 3 microsecond digits to get milliseconds
                return s[:-3]
            except Exception:
                return dt.isoformat()

        # Normalize fields to what the frontend expects:
        # - issue_date (same as borrowed_at)
        # - return_date (same as returned_at)
        # - status: map internal values to frontend values ('active' for borrowed)
        status_map = {
            'borrowed': 'active',
            'returned': 'returned',
            'overdue': 'overdue'
        }

        # Prepare nested user/book dicts with expected keys
        user_dict = None
        if self.user:
            u = self.user.to_dict()
            user_dict = {
                'id': str(u.get('id')) if u.get('id') else None,
                'name': u.get('full_name') or u.get('username') or '',
                'email': u.get('email')
            }

        book_dict = None
        if self.book:
            b = self.book.to_dict()
            book_dict = {
                'id': str(b.get('id')) if b.get('id') else None,
                'title': b.get('title'),
                'isbn': b.get('isbn'),
                # include optional display fields so frontend can render thumbnails in borrow views
                'author': b.get('author'),
                'publisher': b.get('publisher'),
                'cover_url': b.get('cover_url'),
                'location': b.get('location')
            }

        raw_status = self.status.value if hasattr(self.status, 'value') else str(self.status)
        normalized_status = status_map.get(raw_status, raw_status)

        return {
            "id": str(self.id) if self.id else None,
            "user_id": str(self.user_id) if self.user_id else None,
            "book_id": str(self.book_id) if self.book_id else None,
            # include both canonical (borrowed_at/returned_at) and frontend-friendly
            # aliases (issue_date/return_date) to satisfy schema and UI
            "borrowed_at": _iso_ms(self.borrowed_at),
            "issue_date": _iso_ms(self.borrowed_at),
            "due_date": _iso_ms(self.due_date),
            "returned_at": _iso_ms(self.returned_at),
            "return_date": _iso_ms(self.returned_at),
            "status": normalized_status,
            "user": user_dict,
            "book": book_dict
        }

@event.listens_for(BorrowRecord, 'load')
def receive_load(target, context):
    """Convert UUID to string when loading from database"""
    target.id = str(target.id) if target.id else None
    target.user_id = str(target.user_id) if target.user_id else None
    target.book_id = str(target.book_id) if target.book_id else None