from sqlalchemy import Column, Integer, String, ForeignKey
from app.models.base import BaseModel
from app.core.custom_types import SQLiteUUID
from datetime import datetime
from sqlalchemy import DateTime

class NotesAccessLog(BaseModel):
    __tablename__ = "notes_access_logs"

    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    user_id = Column(SQLiteUUID, ForeignKey("users.id"))
    action = Column(String)  # viewed / downloaded
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
