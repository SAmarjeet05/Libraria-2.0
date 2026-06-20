from datetime import datetime, date
from sqlalchemy import Column, Integer, DateTime
from app.core.database import Base
import uuid

class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class BaseModel(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True, index=True)

    def dict(self):
        result = {}
        for c in self.__table__.columns:
            val = getattr(self, c.name)
            # stringify UUIDs for safe JSON / pydantic serialization
            try:
                if isinstance(val, uuid.UUID):
                    val = str(val)
            except Exception:
                pass
            # convert datetimes/dates to ISO strings for JSON serialization
            try:
                if isinstance(val, (datetime, date)):
                    val = val.isoformat()
            except Exception:
                pass
            result[c.name] = val
        return result