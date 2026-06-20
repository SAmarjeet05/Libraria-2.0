from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, Text, ForeignKey
from sqlalchemy import Enum as SAEnum
import enum

from .base import Base
from ..core.custom_types import SQLiteUUID


class CommentStatus(str, enum.Enum):
    ACTIVE = "active"
    DELETED = "deleted"
    FLAGGED = "flagged"


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(SQLiteUUID, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("community_comments.id"), nullable=True)
    content = Column(Text)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    upvotes = Column(Integer, nullable=False, default=0)
    status = Column(SAEnum(CommentStatus), nullable=False, default=CommentStatus.ACTIVE)

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": int(self.post_id) if self.post_id is not None else None,
            "user_id": str(self.user_id) if self.user_id else None,
            "parent_id": int(self.parent_id) if self.parent_id is not None else None,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "upvotes": int(self.upvotes),
            "status": self.status.value if hasattr(self.status, 'value') else str(self.status)
        }
