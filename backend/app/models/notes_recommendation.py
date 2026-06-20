from sqlalchemy import Column, Integer, Float, String, ForeignKey
from app.models.base import BaseModel, TimestampMixin
from app.core.custom_types import SQLiteUUID

class NotesRecommendation(BaseModel, TimestampMixin):
    __tablename__ = "notes_recommendations"

    user_id = Column(SQLiteUUID, ForeignKey("users.id"))
    note_id = Column(Integer, ForeignKey("notes.id"))
    source = Column(String)
    score = Column(Float)
