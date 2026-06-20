from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.community_comment import CommunityComment
from ..schemas.community_comment import CommunityCommentCreate
from ..models.user import User
import uuid


def create_comment(db: Session, comment_in: CommunityCommentCreate, user_id: str) -> dict:
    c = CommunityComment(
        user_id=uuid.UUID(user_id) if user_id else None,
        post_id=comment_in.post_id,
        parent_id=comment_in.parent_id if hasattr(comment_in, 'parent_id') else None,
        content=comment_in.content,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    # attach user info to the returned dict for the frontend to display name
    user = None
    try:
        user = db.query(User).filter(User.id == c.user_id).first()
    except Exception:
        user = None
    res = c.to_dict()
    res['user'] = user.to_dict() if user else None
    # provide a convenience user_name field (prefer full_name then username)
    if user:
        res['user_name'] = user.full_name or user.username
    else:
        res['user_name'] = None
    return res


def list_comments_for_post(db: Session, post_id: int) -> List[CommunityComment]:
    # Join with users to include commenter info in the returned data
    from ..models.post_like import PostLike, LikeTarget
    rows = db.query(CommunityComment).filter(CommunityComment.post_id == post_id).order_by(CommunityComment.created_at.asc()).all()
    out: List[dict] = []
    for c in rows:
        # try to fetch the user
        user = None
        try:
            user = db.query(User).filter(User.id == c.user_id).first()
        except Exception:
            user = None
        d = c.to_dict()
        d['user'] = user.to_dict() if user else None
        d['user_name'] = user.full_name or user.username if user else None
        
        # Count upvotes and downvotes from PostLike table
        try:
            upvotes_count = db.query(PostLike).filter(
                PostLike.target_id == c.id,
                PostLike.target_type == LikeTarget.COMMENT
            ).count()
            downvotes_count = db.query(PostLike).filter(
                PostLike.target_id == c.id,
                PostLike.target_type == LikeTarget.COMMENT_DISLIKE
            ).count()
            d['upvotes'] = upvotes_count
            d['downvotes'] = downvotes_count
        except Exception:
            d['upvotes'] = 0
            d['downvotes'] = 0
        
        out.append(d)
    return out


def delete_comment(db: Session, comment_id: int, user_id: str = None, is_admin: bool = False) -> bool:
    c = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not c:
        return False
    # Check ownership: allow if user is owner or admin
    if user_id and not is_admin:
        if str(c.user_id) != str(user_id):
            return None  # Unauthorized
    db.delete(c)
    db.commit()
    return True


def update_comment(db: Session, comment_id: int, content: str, user_id: str = None, is_admin: bool = False) -> Optional[dict]:
    c = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not c:
        return None
    # Check ownership: allow if user is owner or admin
    if user_id and not is_admin:
        if str(c.user_id) != str(user_id):
            return None  # Unauthorized
    c.content = content
    db.commit()
    db.refresh(c)
    return c.to_dict()
