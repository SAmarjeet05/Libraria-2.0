from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.community_post import CommunityPost
from ..schemas.community_post import CommunityPostCreate
import uuid


def create_post(db: Session, post_in: CommunityPostCreate, user_id: str) -> dict:
    post = CommunityPost(
        user_id=uuid.UUID(user_id) if user_id else None,
        title=post_in.title,
        content=post_in.content,
        category=post_in.category,
        tag_id=post_in.tag_id,
        attachments=post_in.attachments or [],
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post.to_dict()


def get_post(db: Session, post_id: int) -> Optional[CommunityPost]:
    return db.query(CommunityPost).filter(CommunityPost.id == post_id).first()


def list_posts(db: Session) -> List[CommunityPost]:
    return db.query(CommunityPost).filter(CommunityPost.status != 'deleted').order_by(CommunityPost.created_at.desc()).all()


def delete_post(db: Session, post_id: int) -> bool:
    p = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True


def update_post(db: Session, post_id: int, data: dict) -> Optional[dict]:
    p = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not p:
        return None
    # allowed fields to update
    for k in ('title', 'content', 'category', 'tag_id', 'attachments', 'status'):
        if k in data:
            setattr(p, k, data[k])
    db.commit()
    db.refresh(p)
    return p.to_dict()
