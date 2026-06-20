from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..crud import crud_ebook_issue
from ..schemas.ebook_issue import EbookIssue, EbookIssueCreate
from ..schemas.token import TokenPayload
from ..routes.auth import get_current_user

router = APIRouter(prefix="/ebook_issues", tags=["ebook_issues"])


@router.get("", response_model=List[EbookIssue])
async def get_all_ebook_issues(db: Session = Depends(get_db), current_user: TokenPayload = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud_ebook_issue.get_all_ebook_issues(db)


@router.get("/user/{user_id}", response_model=List[EbookIssue])
async def get_user_issues(user_id: str, db: Session = Depends(get_db), current_user: TokenPayload = Depends(get_current_user)):
    if not current_user.is_admin and str(current_user.user_id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud_ebook_issue.get_user_ebook_issues(db, user_id)


@router.post("/issue", response_model=EbookIssue)
async def issue_ebook(payload: EbookIssueCreate, db: Session = Depends(get_db), current_user: TokenPayload = Depends(get_current_user)):
    # Allow admins to issue on behalf; users may also request issuance for themselves
    if not current_user.is_admin and str(current_user.user_id) != payload.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to issue for this user")
    try:
        rec = crud_ebook_issue.create_ebook_issue(db, payload)
    except ValueError as ve:
        # Already issued
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # crud layer returns dicts for compatibility; if we get a dict, return it directly
    if isinstance(rec, dict):
        return rec
    # otherwise assume it's an ORM object
    return EbookIssue.from_orm(rec)


@router.post("/revoke/{issue_id}", response_model=EbookIssue)
async def revoke_issue(issue_id: str, db: Session = Depends(get_db), current_user: TokenPayload = Depends(get_current_user)):
    # Allow admins or the user who was issued the e-book to revoke it
    issue = crud_ebook_issue.get_ebook_issue(db, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Ebook issue not found")

    # `issue` is a dict returned from the CRUD layer
    owner_id = str(issue.get('user_id')) if issue.get('user_id') is not None else None
    if not current_user.is_admin and str(current_user.user_id) != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized to revoke this issue")

    rec = crud_ebook_issue.revoke_ebook_issue(db, issue_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Ebook issue not found")
    # CRUD returns a dict for compatibility
    if isinstance(rec, dict):
        return rec
    return EbookIssue.from_orm(rec)
