from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WishlistCreate(BaseModel):
    book_id: str
    notes: Optional[str] = None
    status: Optional[str] = Field(default="active")

class WishlistUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class WishlistOut(BaseModel):
    id: int
    user_id: str
    book_id: str
    added_at: Optional[datetime]
    status: str
    notes: Optional[str]

    class Config:
        orm_mode = True
