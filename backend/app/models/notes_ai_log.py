from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from app.models.base import BaseModel, TimestampMixin

class NotesAILog(BaseModel, TimestampMixin):
    __tablename__ = "notes_ai_logs"

    # Replaced note reference with the requesting user's id for auditability
    user_id = Column(Integer, nullable=True)
    operation = Column(String)
    response_time = Column(Float)
    status = Column(String)
    raw_output = Column(Text)
    execution_result = Column(Text, nullable=True)
    user_input = Column(Text, nullable=True)
