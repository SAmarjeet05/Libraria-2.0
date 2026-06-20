from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from app.models.base import BaseModel, TimestampMixin
from app.core.custom_types import SQLiteUUID

class NotesReview(BaseModel, TimestampMixin):
    __tablename__ = "notes_reviews"

    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    reviewed_by = Column(SQLiteUUID, ForeignKey("users.id"))
    action = Column(String)
    comment = Column(Text)
    similarity_score = Column(Float)
    plagiarism_score = Column(Float)
