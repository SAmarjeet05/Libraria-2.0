from sqlalchemy.orm import Session
from app.models.wishlist import Wishlist
from typing import List, Optional
from datetime import datetime


def create_wishlist_item(db: Session, user_id: str, book_id: str, notes: Optional[str] = None, status: str = "active") -> Wishlist:
    item = Wishlist(user_id=user_id, book_id=book_id, notes=notes, status=status, added_at=datetime.utcnow())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_wishlist_for_user(db: Session, user_id: str) -> List[Wishlist]:
    return db.query(Wishlist).filter(Wishlist.user_id == user_id).order_by(Wishlist.added_at.desc()).all()


def get_wishlist_item(db: Session, item_id: int) -> Optional[Wishlist]:
    return db.query(Wishlist).filter(Wishlist.id == item_id).first()


def update_wishlist_item(db: Session, item_id: int, status: Optional[str] = None, notes: Optional[str] = None) -> Optional[Wishlist]:
    item = get_wishlist_item(db, item_id)
    if not item:
        return None
    if status is not None:
        item.status = status
    if notes is not None:
        item.notes = notes
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_wishlist_item(db: Session, item_id: int) -> bool:
    item = get_wishlist_item(db, item_id)
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True
