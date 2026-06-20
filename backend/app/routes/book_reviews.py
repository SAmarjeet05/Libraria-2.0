from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.routes.auth import get_current_user
from app.schemas.book_review import BookReviewCreate, BookReviewUpdate, BookReviewOut
from app.crud import crud_book_review

router = APIRouter(prefix="/book-reviews", tags=["book_reviews"])


@router.get('/book/{book_id}', response_model=list[BookReviewOut])
def list_reviews(book_id: str, limit: int = 50, offset: int = 0, filter: Optional[str] = None, sort: Optional[str] = None, db: Session = Depends(get_db), token=Depends(get_current_user)):
    try:
        rows = crud_book_review.get_reviews_for_book(db, book_id, limit=limit, offset=offset, filter_type=filter, sort=sort)
        # if the user has reviewed, put their review at top
        try:
            user_id = token.user_id
            user_review = crud_book_review.get_user_review_for_book(db, user_id, book_id)
            if user_review:
                # ensure user's review is first in the list
                rows = [user_review] + [r for r in rows if r.get('id') != user_review.get('id')]
        except Exception:
            pass
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/', response_model=BookReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(payload: BookReviewCreate, db: Session = Depends(get_db), token=Depends(get_current_user)):
    try:
        user_id = token.user_id
        rec = crud_book_review.create_review(db, user_id, payload)
        return rec
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put('/{review_id}', response_model=BookReviewOut)
def edit_review(review_id: str, payload: BookReviewUpdate, db: Session = Depends(get_db), token=Depends(get_current_user)):
    try:
        user_id = token.user_id
        updated = crud_book_review.update_review(db, review_id, user_id, payload)
        if not updated:
            raise HTTPException(status_code=404, detail='Review not found')
        return updated
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/{review_id}')
def remove_review(review_id: str, db: Session = Depends(get_db), token=Depends(get_current_user)):
    try:
        user_id = token.user_id
        is_admin = getattr(token, 'is_admin', False)
        ok = crud_book_review.delete_review(db, review_id, user_id, is_admin=is_admin)
        if not ok:
            raise HTTPException(status_code=404, detail='Review not found')
        return {'status': 'ok'}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/{review_id}/vote')
def vote(review_id: str, vote: str, db: Session = Depends(get_db), token=Depends(get_current_user)):
    try:
        if vote not in ('up', 'down'):
            raise HTTPException(status_code=400, detail='vote must be "up" or "down"')
        rec = crud_book_review.vote_review(db, review_id, vote)
        if not rec:
            raise HTTPException(status_code=404, detail='Review not found')
        return rec
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
