from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.tag import Tag
from ..schemas.tag import TagCreate


def create_tag(db: Session, tag_in: TagCreate) -> dict:
    t = Tag(name=tag_in.name)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t.to_dict()


def list_tags(db: Session) -> List[Tag]:
    return db.query(Tag).order_by(Tag.name.asc()).all()


def get_tag(db: Session, tag_id: int) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.id == tag_id).first()


def delete_tag(db: Session, tag_id: int) -> bool:
    t = db.query(Tag).filter(Tag.id == tag_id).first()
    if not t:
        return False
    db.delete(t)
    db.commit()
    return True
