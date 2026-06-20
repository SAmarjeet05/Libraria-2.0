from pydantic import BaseModel
from typing import Optional, List


class CommunityPostBase(BaseModel):
    title: str
    content: Optional[str] = None
    category: str
    tag_id: Optional[int] = None
    attachments: Optional[List[str]] = None


class CommunityPostCreate(CommunityPostBase):
    pass


class CommunityPost(CommunityPostBase):
    id: int
    user_id: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]
    views: Optional[int]
    upvotes: Optional[int]
    status: Optional[str]

    class Config:
        orm_mode = True
