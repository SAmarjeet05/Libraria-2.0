from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, Enum, String, Text, ForeignKey, Integer as SAInteger
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
import enum

from .base import Base
from ..core.custom_types import SQLiteUUID


class PostCategory(str, enum.Enum):
    DISCUSSION = "discussion"
    BOOK_REVIEW = "book_review"
    QUESTION = "question"
    ANNOUNCEMENT = "announcement"


class PostStatus(str, enum.Enum):
    ACTIVE = "active"
    DELETED = "deleted"
    FLAGGED = "flagged"


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(SQLiteUUID, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text)
    category = Column(Enum(PostCategory), nullable=False)
    tag_id = Column(SAInteger, ForeignKey("tags.id"), nullable=True)
    attachments = Column(SQLiteJSON, default=list)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    views = Column(Integer, nullable=False, default=0)
    upvotes = Column(Integer, nullable=False, default=0)
    status = Column(Enum(PostStatus), nullable=False, default=PostStatus.ACTIVE)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": str(self.user_id) if self.user_id else None,
            "title": self.title,
            "content": self.content,
            "category": self.category.value if hasattr(self.category, 'value') else str(self.category),
            "tag_id": int(self.tag_id) if self.tag_id is not None else None,
            "attachments": self.attachments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "views": int(self.views),
            "upvotes": int(self.upvotes),
            "status": self.status.value if hasattr(self.status, 'value') else str(self.status)
        }
