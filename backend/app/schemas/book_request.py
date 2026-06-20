from pydantic import BaseModel
from typing import Optional


class BookRequestBase(BaseModel):
    book_id: Optional[str] = None


class BookRequestCreate(BookRequestBase):
    pass


class BookRequest(BookRequestBase):
    id: int
    user_id: Optional[str]
    status: Optional[str]
    created_at: Optional[str]

    class Config:
        orm_mode = True


class BookRequestStatusUpdate(BaseModel):
    status: str
