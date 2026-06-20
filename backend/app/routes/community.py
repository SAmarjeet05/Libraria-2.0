from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from app.core.database import get_db
from app.routes.auth import get_current_user
from app.crud import crud_community_post, crud_community_comment, crud_post_like
from app.models.post_like import LikeTarget
from app.schemas.community_post import CommunityPostCreate
from app.schemas.community_comment import CommunityCommentCreate

router = APIRouter(prefix="/community", tags=["community"])


@router.post("/posts", status_code=status.HTTP_201_CREATED)
def create_post(post_in: CommunityPostCreate, db: Session = Depends(get_db), token=Depends(get_current_user)):
    # Only admins allowed to create posts for now
    if not token.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return crud_community_post.create_post(db, post_in, token.user_id)


@router.get("/posts", response_model=List[dict])
def list_posts(db: Session = Depends(get_db)):
    try:
        rows = crud_community_post.list_posts(db)
        out: List[dict] = []
        # Avoid N+1 where possible; for now do lightweight counts per post
        from app.models.community_comment import CommunityComment
        for r in rows:
            d = r.to_dict()
            # comments count
            try:
                comments_count = db.query(CommunityComment).filter(CommunityComment.post_id == r.id).count()
            except Exception:
                comments_count = 0
            d['comments_count'] = comments_count
            # likes count from likes table
            try:
                likes = crud_post_like.count_likes(db, r.id, LikeTarget.POST)
            except Exception:
                likes = 0
            d['likes'] = likes
            d['upvotes'] = likes
            
            # User vote will be null for unauthenticated users
            d['user_vote'] = None
            
            out.append(d)
        return out
    except Exception as e:
        logging.exception("Failed to list posts")
        # Return a clearer HTTP error so the frontend can see the message
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/posts/{post_id}")
def get_post(post_id: int, db: Session = Depends(get_db)):
    p = crud_community_post.get_post(db, post_id)
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return p.to_dict()


@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), token=Depends(get_current_user)):
    if not token.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    ok = crud_community_post.delete_post(db, post_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return {"status": "deleted"}


@router.patch("/posts/{post_id}")
def edit_post(post_id: int, payload: dict, db: Session = Depends(get_db), token=Depends(get_current_user)):
    # Only admins allowed to edit posts
    if not token.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    updated = crud_community_post.update_post(db, post_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return updated


# Comments
@router.post("/comments", status_code=status.HTTP_201_CREATED)
def create_comment(comment_in: CommunityCommentCreate, db: Session = Depends(get_db), token=Depends(get_current_user)):
    return crud_community_comment.create_comment(db, comment_in, token.user_id)


@router.get("/posts/{post_id}/comments", response_model=List[dict])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    # CRUD now returns dicts enriched with user info
    rows = crud_community_comment.list_comments_for_post(db, post_id)
    return rows


@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db), token=Depends(get_current_user)):
    # Fetch the comment first
    from app.models.community_comment import CommunityComment
    c = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    # Allow deletion if user is admin or is the comment owner
    if not (token.is_admin or str(c.user_id) == str(token.user_id)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")
    
    ok = crud_community_comment.delete_comment(db, comment_id, token.user_id, token.is_admin)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return {"status": "deleted"}


@router.patch("/comments/{comment_id}")
def edit_comment(comment_id: int, payload: dict, db: Session = Depends(get_db), token=Depends(get_current_user)):
    # Fetch the comment first
    from app.models.community_comment import CommunityComment
    c = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    # Allow edit if user is admin or is the comment owner
    if not (token.is_admin or str(c.user_id) == str(token.user_id)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this comment")
    
    updated = crud_community_comment.update_comment(db, comment_id, payload.get('content'), token.user_id, token.is_admin)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return updated


# Likes (toggle)
@router.post("/likes/toggle")
def toggle_like(post_id: int, db: Session = Depends(get_db), token=Depends(get_current_user)):
    # If like exists, delete it; otherwise create
    existing = crud_post_like.get_like(db, post_id, token.user_id, LikeTarget.POST)
    if existing:
        crud_post_like.delete_like(db, existing.id)
        new_count = crud_post_like.count_likes(db, post_id, LikeTarget.POST)
        return {"status": "unliked", "upvotes": new_count, "user_vote": None}
    else:
        like = crud_post_like.create_like(db, post_id, token.user_id, LikeTarget.POST)
        new_count = crud_post_like.count_likes(db, post_id, LikeTarget.POST)
        return {"status": "liked", "upvotes": new_count, "user_vote": "up", "like": like}


# Comment like toggle
@router.post("/comments/{comment_id}/like")
def toggle_comment_like(comment_id: int, db: Session = Depends(get_db), token=Depends(get_current_user)):
    existing = crud_post_like.get_like(db, comment_id, token.user_id, LikeTarget.COMMENT)
    if existing:
        crud_post_like.delete_like(db, existing.id)
        upvotes = crud_post_like.count_likes(db, comment_id, LikeTarget.COMMENT)
        downvotes = crud_post_like.count_likes(db, comment_id, LikeTarget.COMMENT_DISLIKE)
        # include post_id so frontend can map the comment to its post even when comments are not loaded
        from app.models.community_comment import CommunityComment
        post_id = None
        try:
            c = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
            post_id = int(c.post_id) if c else None
        except Exception:
            post_id = None
        return {"status": "unliked", "upvotes": upvotes, "downvotes": downvotes, "post_id": post_id}
    else:
        like = crud_post_like.create_like(db, comment_id, token.user_id, LikeTarget.COMMENT)
        upvotes = crud_post_like.count_likes(db, comment_id, LikeTarget.COMMENT)
        downvotes = crud_post_like.count_likes(db, comment_id, LikeTarget.COMMENT_DISLIKE)
        from app.models.community_comment import CommunityComment
        post_id = None
        try:
            c = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
            post_id = int(c.post_id) if c else None
        except Exception:
            post_id = None
        return {"status": "liked", "upvotes": upvotes, "downvotes": downvotes, "like": like, "post_id": post_id}


# Comment dislike toggle
@router.post("/comments/{comment_id}/dislike")
def toggle_comment_dislike(comment_id: int, db: Session = Depends(get_db), token=Depends(get_current_user)):
    existing = crud_post_like.get_like(db, comment_id, token.user_id, LikeTarget.COMMENT_DISLIKE)
    if existing:
        crud_post_like.delete_like(db, existing.id)
        upvotes = crud_post_like.count_likes(db, comment_id, LikeTarget.COMMENT)
        downvotes = crud_post_like.count_likes(db, comment_id, LikeTarget.COMMENT_DISLIKE)
        from app.models.community_comment import CommunityComment
        post_id = None
        try:
            c = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
            post_id = int(c.post_id) if c else None
        except Exception:
            post_id = None
        return {"status": "undisliked", "upvotes": upvotes, "downvotes": downvotes, "post_id": post_id}
    else:
        like = crud_post_like.create_like(db, comment_id, token.user_id, LikeTarget.COMMENT_DISLIKE)
        upvotes = crud_post_like.count_likes(db, comment_id, LikeTarget.COMMENT)
        downvotes = crud_post_like.count_likes(db, comment_id, LikeTarget.COMMENT_DISLIKE)
        from app.models.community_comment import CommunityComment
        post_id = None
        try:
            c = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
            post_id = int(c.post_id) if c else None
        except Exception:
            post_id = None
        return {"status": "disliked", "upvotes": upvotes, "downvotes": downvotes, "like": like, "post_id": post_id}


# Report comment
@router.post("/comments/{comment_id}/report")
def report_comment(comment_id: int, payload: dict, db: Session = Depends(get_db), token=Depends(get_current_user)):
    from app.models.community_comment import CommunityComment
    c = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    # Mark comment as flagged
    c.status = "FLAGGED"
    db.commit()
    return {"status": "reported", "message": "Comment has been reported and flagged for review"}
