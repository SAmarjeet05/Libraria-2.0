from pydantic import BaseModel
from typing import Optional


class CommunityCommentBase(BaseModel):
    post_id: int
    content: str
    parent_id: Optional[int] = None


class CommunityCommentCreate(CommunityCommentBase):
    pass


class CommunityComment(CommunityCommentBase):
    id: int
    user_id: Optional[str]
    created_at: Optional[str]

    class Config:
        orm_mode = True
