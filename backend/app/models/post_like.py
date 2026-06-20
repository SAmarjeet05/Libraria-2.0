from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy import Enum as SAEnum, String
import enum

from .base import Base
from ..core.custom_types import SQLiteUUID


class LikeTarget(str, enum.Enum):
    POST = "post"
    COMMENT = "comment"
    COMMENT_DISLIKE = "comment_dislike"


class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(SQLiteUUID, ForeignKey("users.id"), nullable=False)
    target_type = Column(SAEnum(LikeTarget), nullable=False)
    target_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": str(self.user_id) if self.user_id else None,
            "target_type": self.target_type.value if hasattr(self.target_type, 'value') else str(self.target_type),
            "target_id": int(self.target_id),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
