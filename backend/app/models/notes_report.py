from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy import DateTime as SA_DateTime
from app.models.base import BaseModel, TimestampMixin
from app.core.custom_types import SQLiteUUID
from datetime import datetime


class NotesReport(BaseModel, TimestampMixin):
    __tablename__ = "notes_reports"
    __table_args__ = {"extend_existing": True}

    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    reported_by = Column(SQLiteUUID, ForeignKey("users.id"))
    reason = Column(Text, nullable=False)
    status = Column(String, default="pending")
    admin_response = Column(Text, nullable=True)
    created_at = Column(SA_DateTime, default=datetime.utcnow, nullable=False)
