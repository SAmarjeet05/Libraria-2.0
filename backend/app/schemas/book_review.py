from pydantic import BaseModel
from typing import Optional


class BookReviewCreate(BaseModel):
    book_id: str
    rating: int
    review_text: Optional[str] = None


class BookReviewUpdate(BaseModel):
    rating: Optional[int] = None
    review_text: Optional[str] = None


class BookReviewOut(BaseModel):
    id: Optional[int]
    user_id: Optional[str]
    book_id: Optional[str]
    rating: Optional[int]
    review_text: Optional[str]
    upvotes: int = 0
    downvotes: int = 0
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True
