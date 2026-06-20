from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.wishlist import WishlistCreate, WishlistOut, WishlistUpdate
from app.routes.auth import get_current_user
from app.crud import crud_wishlist

router = APIRouter(prefix="/wishlist", tags=["wishlist"])

@router.post("/", response_model=WishlistOut)
def add_to_wishlist(item_in: WishlistCreate, db: Session = Depends(get_db), token=Depends(get_current_user)):
    """Add a book to the current user's wishlist"""
    user_id = token.user_id
    # create item
    item = crud_wishlist.create_wishlist_item(db, user_id=user_id, book_id=item_in.book_id, notes=item_in.notes, status=item_in.status or "active")
    return item.to_dict()

@router.get("/", response_model=List[WishlistOut])
def list_wishlist(db: Session = Depends(get_db), token=Depends(get_current_user)):
    """List wishlist items for the current user"""
    user_id = token.user_id
    items = crud_wishlist.get_wishlist_for_user(db, user_id=user_id)
    return [i.to_dict() for i in items]

@router.get("/{item_id}", response_model=WishlistOut)
def get_wishlist_item(item_id: int, db: Session = Depends(get_db), token=Depends(get_current_user)):
    item = crud_wishlist.get_wishlist_item(db, item_id)
    if not item or item.user_id != token.user_id:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return item.to_dict()

@router.patch("/{item_id}", response_model=WishlistOut)
def update_item(item_id: int, upd: WishlistUpdate, db: Session = Depends(get_db), token=Depends(get_current_user)):
    item = crud_wishlist.get_wishlist_item(db, item_id)
    if not item or item.user_id != token.user_id:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    updated = crud_wishlist.update_wishlist_item(db, item_id, status=upd.status, notes=upd.notes)
    if not updated:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return updated.to_dict()

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), token=Depends(get_current_user)):
    item = crud_wishlist.get_wishlist_item(db, item_id)
    if not item or item.user_id != token.user_id:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    ok = crud_wishlist.delete_wishlist_item(db, item_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to delete wishlist item")
    return {"status": "deleted"}
