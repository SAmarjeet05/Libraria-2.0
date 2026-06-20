from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.routes.auth import get_current_user
from app.crud import crud_tag
from app.schemas.tag import TagCreate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_tag(tag_in: TagCreate, db: Session = Depends(get_db), token=Depends(get_current_user)):
    if not token.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return crud_tag.create_tag(db, tag_in)


@router.get("/", response_model=List[dict])
def list_tags(db: Session = Depends(get_db)):
    rows = crud_tag.list_tags(db)
    return [r.to_dict() for r in rows]


@router.delete("/{tag_id}")
def delete_tag(tag_id: int, db: Session = Depends(get_db), token=Depends(get_current_user)):
    if not token.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    ok = crud_tag.delete_tag(db, tag_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return {"status": "deleted"}
