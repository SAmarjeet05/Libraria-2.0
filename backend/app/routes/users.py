from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..core.database import get_db
from ..crud import crud_user
from ..schemas.user import User
from ..models.borrow_record import BorrowRecord
from ..schemas.token import TokenPayload
from ..routes.auth import get_current_user
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """Get user details by ID (admin only)"""
    try:
        if not current_user.is_admin:
            raise HTTPException(
                status_code=403,
                detail="Not authorized - Admin privileges required"
            )
        
        # Get user from database
        user = crud_user.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Return the full user object including status
        return User(
            id=str(user.id),
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            preferences=user.preferences,
            status=(user.status.value if hasattr(user.status, 'value') else str(user.status)) if getattr(user, 'status', None) is not None else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/", response_model=List[dict])
async def list_users(
    db: Session = Depends(get_db),
    current_user: TokenPayload = Depends(get_current_user)
):
    """List users (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized - Admin privileges required")

    users = crud_user.get_all(db)
    out = []
    for u in users:
        try:
            borrow_count = int(db.query(BorrowRecord).filter(BorrowRecord.user_id == u.id).count())
        except Exception:
            borrow_count = 0

        created_at = None
        try:
            if getattr(u, 'created_at', None):
                # convert to ISO string for frontend
                created_at = u.created_at.isoformat()
        except Exception:
            created_at = None

        out.append({
            "id": str(u.id),
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "role": (u.role.value if hasattr(u.role, 'value') else str(u.role)),
            "is_active": bool(u.is_active),
            "status": (u.status.value if hasattr(u.status, 'value') else str(u.status)) if getattr(u, 'status', None) is not None else None,
            "is_verified": bool(u.is_verified),
            "preferences": u.preferences,
            "created_at": created_at,
            "borrow_count": borrow_count,
        })

    return out


@router.delete("/{user_id}")
async def delete_user(user_id: str, db: Session = Depends(get_db), current_user: TokenPayload = Depends(get_current_user)):
    """Delete a user (admin only)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized - Admin privileges required")
    ok = crud_user.delete_user(db, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "deleted"}


@router.post('/me/delete')
async def delete_me(db: Session = Depends(get_db), current_user: TokenPayload = Depends(get_current_user)):
    """Soft-delete the current user's account (user action). Marks status=DELETED and deactivates account."""
    try:
        user = crud_user.get_by_id(db, current_user.user_id)
        if not user:
            raise HTTPException(status_code=404, detail='User not found')
        user.status = getattr(__import__('app.models.user', fromlist=['UserStatus']), 'UserStatus').DELETED
        user.is_active = False
        db.add(user)
        db.commit()
        return {'status': 'deleted'}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))