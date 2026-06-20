from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.routes.auth import get_current_user
from app.crud.crud_youtube_recommendations import (
    get_recommended_videos,
    get_user_activity_count,
    get_user_interest_subjects_from_all_activity
)

router = APIRouter(prefix="/youtube-recommendations", tags=["youtube-recommendations"])


class YouTubeVideoRecommendation(BaseModel):
    id: int
    title: str
    description: Optional[str]
    youtube_url: str
    video_id: str
    thumbnail_url: Optional[str]
    subject: Optional[str]
    course: Optional[str]
    semester: Optional[str]
    popularity_score: float
    
    class Config:
        from_attributes = True


class RecommendationsResponse(BaseModel):
    recommendations: List[YouTubeVideoRecommendation]
    reason: str
    activity_count: Optional[int]
    interested_subjects: Optional[int]


@router.get("/videos", response_model=RecommendationsResponse)
async def get_recommended_videos_endpoint(
    limit: int = 6,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized recommended videos for the current user by searching YouTube in real-time.
    
    - Returns recommendations based on user's notes activity (access, downloads, views)
    - Searches YouTube in real-time for matching content
    - Sorts by popularity (view count)
    
    Reasons returned:
    - new_user: User has no activity history
    - no_subjects: User has activity but no common subjects
    - no_videos_found: No videos found on YouTube for user's interests
    - success: Recommendations successfully generated
    """
    user_id = str(current_user.user_id)
    
    try:
        recommended_videos, reason = get_recommended_videos(db, user_id, limit)
        activity = get_user_activity_count(db, user_id)
        interested_subjects = len(get_user_interest_subjects_from_all_activity(db, user_id))
        
        # Videos are already in dict format from real-time search
        recommendations_data = [
            YouTubeVideoRecommendation(
                id=video['id'],
                title=video['title'],
                description=video.get('description'),
                youtube_url=video['youtube_url'],
                video_id=video['video_id'],
                thumbnail_url=video.get('thumbnail_url'),
                subject=video.get('subject'),
                course=video.get('course'),
                semester=video.get('semester'),
                popularity_score=video['popularity_score']
            )
            for video in recommended_videos
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
    """Get user's activity statistics."""
    user_id = str(current_user.user_id)
    
    try:
        activity = get_user_activity_count(db, user_id)
        subjects = get_user_interest_subjects_from_all_activity(db, user_id)
        
        return {
            "activity_count": activity.get('total', 0),
            "notes_activity": activity.get('notes_activity', 0),
            "interested_subjects": len(subjects),
            "subjects": subjects
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
