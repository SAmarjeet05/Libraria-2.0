from pydantic import BaseModel
from typing import Optional


class PostLikeBase(BaseModel):
    post_id: int


class PostLikeCreate(PostLikeBase):
    pass


class PostLike(PostLikeBase):
    id: int
    user_id: Optional[str]
    created_at: Optional[str]

    class Config:
        orm_mode = True
