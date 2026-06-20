from sqlalchemy.orm import Session
from typing import Optional
from ..models.post_like import PostLike, LikeTarget
import uuid


def get_like(db: Session, target_id: int, user_id: str, target_type: LikeTarget = LikeTarget.POST) -> Optional[PostLike]:
    """Return an existing like for a given target (post or comment) by this user."""
    try:
        uid = user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(str(user_id))
    except Exception:
        # invalid user id; behave as if no like exists
        return None
    return db.query(PostLike).filter(
        PostLike.target_id == target_id,
        PostLike.target_type == target_type,
        PostLike.user_id == uid,
    ).first()


def create_like(db: Session, target_id: int, user_id: str, target_type: LikeTarget = LikeTarget.POST) -> dict:
    try:
        uid = user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(str(user_id))
    except Exception:
        raise ValueError("Invalid user id for like creation")
    like = PostLike(target_id=target_id, target_type=target_type, user_id=uid)
    db.add(like)
    db.commit()
    db.refresh(like)
    return like.to_dict()


def delete_like(db: Session, like_id: int) -> bool:
    l = db.query(PostLike).filter(PostLike.id == like_id).first()
    if not l:
        return False
    db.delete(l)
    db.commit()
    return True


def count_likes(db: Session, target_id: int, target_type: LikeTarget = LikeTarget.POST) -> int:
    return db.query(PostLike).filter(PostLike.target_id == target_id, PostLike.target_type == target_type).count()
