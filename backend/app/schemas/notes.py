from typing import Optional
from pydantic import BaseModel, AnyUrl


class NoteCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[str] = None
    tags: Optional[str] = None
    mega_public_link: Optional[AnyUrl] = None
    mega_path: Optional[str] = None
    file_type: Optional[str] = None
    size_bytes: Optional[int] = None
    uploaded_by: Optional[str] = None
    uploader_role: Optional[str] = None


class NoteOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    subject: Optional[str]
    course: Optional[str]
    semester: Optional[str]
    tags: Optional[str]
    mega_public_link: Optional[AnyUrl]
    mega_path: Optional[str]
    file_type: Optional[str]
    size_bytes: Optional[int]
    uploaded_by: Optional[str]
    uploader_role: Optional[str]
    status: Optional[str]
    ai_summary: Optional[str]
    ai_keywords: Optional[str]
    ai_subject_detection: Optional[str]

    class Config:
        from_attributes = True
