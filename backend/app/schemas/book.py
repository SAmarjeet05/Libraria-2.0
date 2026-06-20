from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class BookBase(BaseModel):
    title: str
    author: str
    isbn: str
    category_id: Optional[int] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    total_copies: int
    available_copies: int
    status: str = 'available'
    has_ebook: bool = False
    ebook_url: Optional[str] = None
    location: Optional[str] = None

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    category_id: Optional[int] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    total_copies: int = 1
    has_ebook: bool = False
    ebook_url: Optional[str] = None
    location: Optional[str] = None

class Book(BookBase):
    id: UUID4
    added_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    category_id: Optional[int] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    total_copies: Optional[int] = None
    available_copies: Optional[int] = None
    status: Optional[str] = None
    has_ebook: Optional[bool] = None
    ebook_url: Optional[str] = None
    location: Optional[str] = None