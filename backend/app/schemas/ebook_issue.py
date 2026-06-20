from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EbookIssueBase(BaseModel):
    user_id: str
    book_id: str
    expiry_date: Optional[datetime] = None
    status: str = "active"


class EbookIssueCreate(EbookIssueBase):
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "book_id": "123e4567-e89b-12d3-a456-426614174001",
                "expiry_date": "2025-12-31T23:59:59",
                "status": "active"
            }
        }


class EbookIssue(EbookIssueBase):
    id: str
    issued_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, db_obj):
        return cls(**db_obj.to_dict())
