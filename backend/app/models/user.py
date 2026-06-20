import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, JSON, text
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from app.core.database import Base
from app.core.custom_types import SQLiteUUID
import enum

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"

class User(Base):
    __tablename__ = "users"

    id = Column(SQLiteUUID, primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    full_name = Column(String(100))
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    last_login_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    preferences = Column(SQLiteJSON, default=lambda: {
        "theme": "light",
        "notifications": True,
        "language": "en"
    })
    # New status column: active, suspended, deleted
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)

    def __repr__(self):
        return f"<User {self.username}>"

    def to_dict(self):
        # Ensure all values are JSON-serializable (convert UUIDs and Enums to strings)
        return {
            "id": str(self.id) if self.id else None,
            "username": self.username,
            "email": self.email,
            "role": self.role.value if hasattr(self.role, 'value') else str(self.role),
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "status": (self.status.value if hasattr(self.status, 'value') else str(self.status)) if getattr(self, 'status', None) is not None else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "preferences": self.preferences
        }