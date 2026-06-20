from typing import Optional
from pydantic import BaseModel, EmailStr, validator
from app.models.user import UserRole, UserStatus

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: Optional[UserRole] = UserRole.USER

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    role: Optional[UserRole] = UserRole.USER

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "password": "strongpassword123",
                "full_name": "John Doe"
            }
        }

    @validator('password')
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes when encoded in UTF-8')
        return v

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        return v

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: str

    class Config:
        from_attributes = True

class User(UserInDBBase):
    id: str
    email: EmailStr
    username: str
    full_name: str
    role: UserRole
    status: Optional[UserStatus] = UserStatus.ACTIVE
    is_active: bool = True
    is_verified: bool = False
    preferences: dict = {
        "theme": "light",
        "notifications": True,
        "language": "en"
    }
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "username": "johndoe",
                "full_name": "John Doe",
                "role": "user",
                "is_active": True,
                "is_verified": False,
                "preferences": {
                    "theme": "light",
                    "notifications": True,
                    "language": "en"
                }
            }
        }

class UserInDB(UserInDBBase):
    password_hash: str