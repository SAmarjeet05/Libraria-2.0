from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.routes.auth import get_current_user
from app.crud.crud_notes_recommendations import (
    get_recommended_notes,
    get_user_activity_count,
    get_user_interest_subjects
)
from pydantic import BaseModel
from typing import List, Optional


router = APIRouter(prefix="/notes-recommendations", tags=["notes-recommendations"])


class NoteRecommendation(BaseModel):
    id: int
    title: str
    subject: Optional[str]
    course: Optional[str]
    semester: Optional[str]
    file_type: str
    status: str
    ai_summary: Optional[str]
    
    class Config:
        from_attributes = True


class RecommendationsResponse(BaseModel):
    recommendations: List[NoteRecommendation]
    reason: str
    activity_count: Optional[int]
    interested_subjects: Optional[int]


@router.get("/notes", response_model=RecommendationsResponse)
async def get_recommended_notes_endpoint(
    limit: int = 8,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized recommended notes for the current user.
    
    - Returns recommendations based on user's viewed notes subjects
    - Excludes notes already viewed by the user
    - Sorts by popularity (views and downloads)
    
    Reasons returned:
    - new_user: User has no viewing history
    - no_subjects: User has viewed notes but no common subjects
    - no_notes_in_subjects: No new notes available in user's interest subjects
    - success: Recommendations successfully generated
    """
    user_id = str(current_user.user_id)
    
    try:
        recommended_notes, reason = get_recommended_notes(db, user_id, limit)
        activity = get_user_activity_count(db, user_id)
        interested_subjects = len(get_user_interest_subjects(db, user_id))
        
        # Convert Note objects to NoteRecommendation
        recommendations_data = [
            NoteRecommendation(
                id=note.id,
                title=note.title,
                subject=note.subject,
                course=note.course,
                semester=note.semester,
                file_type=note.file_type,
                status=note.status,
                ai_summary=note.ai_summary
            )
            for note in recommended_notes
        ]
        
        return RecommendationsResponse(
            recommendations=recommendations_data,
            reason=reason,
            activity_count=activity.get('total', 0),
            interested_subjects=interested_subjects if interested_subjects > 0 else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-activity")
async def get_user_activity_endpoint(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's activity statistics with notes."""
    user_id = str(current_user.user_id)
    
    try:
        activity = get_user_activity_count(db, user_id)
        subjects = get_user_interest_subjects(db, user_id)
        
        return {
            "activity_count": activity.get('total', 0),
            "views": activity.get('views', 0),
            "downloads": activity.get('downloads', 0),
            "interested_subjects": len(subjects),
            "subjects": subjects
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
