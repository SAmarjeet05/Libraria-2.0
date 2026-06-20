from sqlalchemy import BigInteger, Column, String, Text, ForeignKey
from app.models.base import BaseModel, TimestampMixin
from app.core.custom_types import SQLiteUUID

class Note(BaseModel, TimestampMixin):
    __tablename__ = "notes"

    title = Column(String, nullable=False)
    description = Column(Text)
    subject = Column(String)
    course = Column(String)
    semester = Column(String)
    tags = Column(Text)
    # Legacy/remote links (nullable for compatibility)
    mega_public_link = Column(String, nullable=True)   # MEGA permanent public URL
    mega_path = Column(String, nullable=True)          # "/app-files/<user_id>/<filename>"
    size_bytes = Column(BigInteger, nullable=True)     # helps track usage

    file_type = Column(String)
    uploaded_by = Column(SQLiteUUID, ForeignKey("users.id"))
    uploader_role = Column(String)
    status = Column(String, default="pending")
    rejection_reason = Column(Text, nullable=True)
    ai_summary = Column(Text)
    ai_keywords = Column(Text)
    ai_subject_detection = Column(Text)
