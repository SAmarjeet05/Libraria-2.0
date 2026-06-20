from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.routes.auth import get_current_user
from app.crud import crud_book_request
from app.schemas.book_request import BookRequestCreate, BookRequestStatusUpdate
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/book-requests",
    tags=["book_requests"]
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_request(req_in: BookRequestCreate, db: Session = Depends(get_db), token=Depends(get_current_user)):
    # Log arrival and token info to help debug client/server response issues.
    try:
        user_id = token.user_id
    except Exception:
        user_id = None
    logger.info(f"book-requests:create_request called by user_id={user_id} payload={req_in.dict()}")
    result = crud_book_request.create_request(db, req_in, user_id)
    logger.info(f"book-requests:create_request committed id={result.get('id')}")
    return result


@router.get("/", response_model=List[dict])
def list_requests(db: Session = Depends(get_db), token=Depends(get_current_user)):
    # admin-only listing
    try:
        if not token.is_admin:
            logger.warning(f"book-requests:list_requests forbidden for user={getattr(token,'user_id', None)}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
        logger.info(f"book-requests:list_requests called by admin user={token.user_id}")
        rows = crud_book_request.get_pending_requests(db)
        return [r.to_dict() for r in rows]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error listing book requests")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{request_id}/status")
async def update_request_status(request_id: int, request: Request, payload: BookRequestStatusUpdate, db: Session = Depends(get_db), token=Depends(get_current_user)):
    # Log raw body for debugging validation issues
    try:
        raw = await request.body()
        logger.info(f"book-requests:update_request_status raw_body={raw}")
    except Exception:
        logger.exception("Could not read raw request body")

    if not token.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    try:
        updated = crud_book_request.update_status(db, request_id, payload.status)
    except ValueError as ve:
        logger.warning(f"book-requests:update_request_status validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.exception("Unexpected error updating request status")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    logger.info(f"book-requests:update_request_status succeeded id={request_id} status={payload.status}")
    return updated
