from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime

from .base import Base


class ReviewVote(Base):
    __tablename__ = "review_votes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    review_id = Column(Integer, nullable=False)
    user_id = Column(String(36), nullable=False)
    vote_type = Column(Enum('up', 'down', name='vote_type'), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "review_id": self.review_id,
            "user_id": self.user_id,
            "vote_type": self.vote_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
