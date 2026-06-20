from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    user_id: Optional[str] = None
    is_admin: bool = False

    @property
    def uuid(self) -> Optional[UUID]:
        """Convert string user_id to UUID if present"""
        return UUID(self.user_id) if self.user_id else None