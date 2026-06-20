from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..models.book_review import BookReview
from ..models.review_vote import ReviewVote
from ..models.user import User


def get_reviews_for_book(db: Session, book_id: str, limit: int = 50, offset: int = 0, filter_type: Optional[str] = None, sort: Optional[str] = None) -> List[dict]:
    q = db.query(BookReview).filter(BookReview.book_id == book_id)
    if filter_type == 'positive':
        q = q.filter(BookReview.rating >= 4)
    elif filter_type == 'critical':
        q = q.filter(BookReview.rating <= 2)

    if sort == 'top':
        # top by (upvotes - downvotes) then rating
        q = q.order_by((BookReview.upvotes - BookReview.downvotes).desc(), BookReview.rating.desc(), BookReview.created_at.desc())
    else:
        q = q.order_by(BookReview.created_at.desc())

    recs = q.offset(offset).limit(limit).all()
    result = []
    for r in recs:
        review_dict = r.to_dict()
        # Add user name
        user = db.query(User).filter(User.id == r.user_id).first()
        if user:
            review_dict['user_name'] = user.full_name or user.username or user.email
        else:
            review_dict['user_name'] = 'Unknown User'
        result.append(review_dict)
    return result


def get_user_review_for_book(db: Session, user_id: str, book_id: str) -> Optional[dict]:
    rec = db.query(BookReview).filter(BookReview.user_id == user_id, BookReview.book_id == book_id).first()
    return rec.to_dict() if rec else None


def create_review(db: Session, user_id: str, review_in) -> dict:
    # review_in is Pydantic model with book_id, rating, review_text
    # Enforce one review per user per book
    existing = db.query(BookReview).filter(BookReview.user_id == user_id, BookReview.book_id == review_in.book_id).first()
    if existing:
        raise ValueError('User has already reviewed this book')

    rec = BookReview(
        user_id=user_id,
        book_id=review_in.book_id,
        rating=review_in.rating,
        review_text=review_in.review_text,
        upvotes=0,
        downvotes=0,
        created_at=datetime.utcnow()
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec.to_dict()


def update_review(db: Session, review_id: str, user_id: str, changes) -> Optional[dict]:
    rec = db.query(BookReview).filter(BookReview.id == int(review_id)).first()
    if not rec:
        return None
    if str(rec.user_id) != str(user_id):
        raise PermissionError('Not authorized to edit this review')
    if changes.rating is not None:
        rec.rating = changes.rating
    if changes.review_text is not None:
        rec.review_text = changes.review_text
    rec.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rec)
    return rec.to_dict()


def delete_review(db: Session, review_id: str, user_id: str, is_admin: bool = False) -> bool:
    rec = db.query(BookReview).filter(BookReview.id == int(review_id)).first()
    if not rec:
        return False
    if not is_admin and str(rec.user_id) != str(user_id):
        raise PermissionError('Not authorized to delete this review')
    db.delete(rec)
    db.commit()
    return True


def vote_review(db: Session, review_id: str, vote: str, user_id: str) -> Optional[dict]:
    rec = db.query(BookReview).filter(BookReview.id == int(review_id)).first()
    if not rec:
        return None
    
    # Check if user has already voted on this review
    existing_vote = db.query(ReviewVote).filter(
        ReviewVote.review_id == int(review_id),
        ReviewVote.user_id == user_id
    ).first()
    
    if existing_vote:
        # User already voted, update their vote
        old_vote = existing_vote.vote_type
        if old_vote == vote:
            # Same vote, don't do anything
            return rec.to_dict()
        
        # Remove old vote count
        if old_vote == 'up':
            rec.upvotes = max(0, (rec.upvotes or 0) - 1)
        else:
            rec.downvotes = max(0, (rec.downvotes or 0) - 1)
        
        # Add new vote count
        if vote == 'up':
            rec.upvotes = (rec.upvotes or 0) + 1
        elif vote == 'down':
            rec.downvotes = (rec.downvotes or 0) + 1
        else:
            raise ValueError('Invalid vote')
        
        # Update the vote record
        existing_vote.vote_type = vote
        existing_vote.created_at = datetime.utcnow()
    else:
        # New vote
        if vote == 'up':
            rec.upvotes = (rec.upvotes or 0) + 1
        elif vote == 'down':
            rec.downvotes = (rec.downvotes or 0) + 1
        else:
            raise ValueError('Invalid vote')
        
        # Create vote record
        vote_record = ReviewVote(
            review_id=int(review_id),
            user_id=user_id,
            vote_type=vote,
            created_at=datetime.utcnow()
        )
        db.add(vote_record)
    
    db.commit()
    db.refresh(rec)
    return rec.to_dict()
