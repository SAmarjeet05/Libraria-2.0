from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.security import verify_password, get_password_hash
from app.models.user import User, UserStatus
from app.schemas.user import UserCreate, UserUpdate


def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def authenticate(db: Session, email: str, password: str) -> Optional[User]:
    user = get_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def create_user(db: Session, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        password_hash=get_password_hash(obj_in.password),
        full_name=obj_in.full_name,
        username=obj_in.username,
        role=obj_in.role,
        status=UserStatus.ACTIVE,
        is_verified=False,
        preferences={
            "theme": "light",
            "notifications": True,
            "language": "en"
        }
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# Alias for backward compatibility
create = create_user

def update_last_login(db: Session, user: User) -> User:
    user.last_login_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_all(db: Session, limit: int = 100, offset: int = 0):
    """Return list of users (pagination optional)"""
    return db.query(User).order_by(User.created_at.desc()).limit(limit).offset(offset).all()


def delete_user(db: Session, user_id: str) -> bool:
    """Delete a user by id. Returns True if deleted, False if not found."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    # Soft-delete: mark status as DELETED and deactivate account
    try:
        user.status = UserStatus.DELETED
        user.is_active = False
        db.add(user)
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False