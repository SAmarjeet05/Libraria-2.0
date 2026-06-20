from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..core.database import get_db
from ..routes.auth import get_current_user
from ..crud import crud_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/books")
def get_recommended_books(
    limit: Optional[int] = 8,
    db: Session = Depends(get_db),
    token=Depends(get_current_user)
):
    """
    Get personalized book recommendations for the current user.
    
    Based on:
    - User's borrowed books (categories)
    - User's ebook issues (categories)
    - User's wishlist (categories)
    - User's book requests (categories)
    
    Books are sorted by popularity score from highest to lowest.
    Already read books are excluded.
    
    Response includes:
    - recommendations: List of recommended books
    - reason: Why recommendations were/weren't found
      - "success": Recommendations found
      - "new_user": User has no activity
      - "no_categories": User has activity but no categories
      - "no_books_in_categories": No available books in user's categories
    - activity_count: Total number of user interactions
    """
    try:
        user_id = token.user_id
        limit = min(limit, 20)  # Max 20 recommendations
        limit = max(limit, 1)   # Min 1 recommendation
        
        result = crud_recommendations.get_recommended_books(db, user_id, limit)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get("/user-activity")
def get_user_activity(
    db: Session = Depends(get_db),
    token=Depends(get_current_user)
):
    """
    Get user's activity breakdown for analytics.
    
    Returns counts of:
    - borrows: Books borrowed
    - ebook_issues: eBooks accessed
    - wishlists: Books wishlisted
    - requests: Books requested
    - views: Books viewed
    - total: Sum of all activities
    """
    try:
        user_id = token.user_id
        activity = crud_recommendations.get_user_activity_count(db, user_id)
        
        return {
            "user_id": user_id,
            "activity": activity,
            "has_activity": activity["total"] > 0
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user activity: {str(e)}"
        )


@router.get("/user-categories")
def get_user_interested_categories(
    db: Session = Depends(get_db),
    token=Depends(get_current_user)
):
    """
    Get categories the user is interested in based on their activities.
    """
    try:
        user_id = token.user_id
        categories = crud_recommendations.get_user_interaction_categories(db, user_id)
        
        return {
            "user_id": user_id,
            "interested_categories": categories,
            "count": len(categories)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get user categories: {str(e)}"
        )
