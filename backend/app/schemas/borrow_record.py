from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class BorrowRecordBase(BaseModel):
    user_id: str
    book_id: str
    due_date: datetime
    status: str = "borrowed"

class BorrowRecordCreate(BorrowRecordBase):
    pass

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "book_id": "123e4567-e89b-12d3-a456-426614174001",
                "borrow_date": "2023-01-01T00:00:00",
                "due_date": "2023-01-15T00:00:00",
                "status": "borrowed"
            }
        }

class BorrowRecord(BorrowRecordBase):
    id: str
    borrowed_at: datetime
    returned_at: Optional[datetime] = None
    user: Optional[dict] = None  # Will include user details
    book: Optional[dict] = None  # Will include book details

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, db_obj):
        # Use the model's to_dict method for conversion
        return cls(**db_obj.to_dict())
    