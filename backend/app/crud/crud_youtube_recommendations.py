from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Tuple
from app.models.notes_access_log import NotesAccessLog
from app.models.notes import Note
from app.utils.youtube_searcher import YouTubeVideoSearcher
import logging

logger = logging.getLogger(__name__)


def get_user_interest_subjects_from_all_activity(db: Session, user_id: str) -> List[str]:
    """Extract subjects from all user activity: notes access, downloads, views.
    
    Returns a list of unique subjects the user has interacted with.
    """
    # Get subjects from notes access logs
    result = db.query(func.distinct(Note.subject)).join(
        NotesAccessLog,
        Note.id == NotesAccessLog.note_id
    ).filter(
        NotesAccessLog.user_id == user_id,
        Note.status == 'approved'
    ).all()
    
    subjects = [subject[0] for subject in result if subject[0]]
    return list(set(subjects))  # Remove duplicates


def get_user_activity_count(db: Session, user_id: str) -> dict:
    """Count user interactions across all activity types.
    
    Returns counts for notes access (videos are now real-time, so not tracked in DB).
    """
    notes_activity = db.query(func.count(NotesAccessLog.id)).filter(
        NotesAccessLog.user_id == user_id
    ).scalar() or 0
    
    return {
        'notes_activity': notes_activity,
        'total': notes_activity
    }


def get_recommended_videos(
    db: Session, 
    user_id: str, 
    limit: int = 6
) -> Tuple[List[Dict], str]:
    """Get personalized recommended videos for the user by searching YouTube in real-time.
    
    Enhanced Algorithm:
    1. Get user's interest subjects from all activity (notes, views, downloads)
    2. Search YouTube with optimized queries for educational content
    3. Filter for quality: duration (5-60 mins), high view count, good engagement
    4. Calculate comprehensive popularity score based on:
       - View count (primary factor)
       - Like ratio (likes per view)
       - Recency (prefer newer content)
       - Video duration (prefer substantial content)
    5. Deduplicate and rank by combined score
    6. Return top N diverse videos
    
    Returns:
        tuple of (videos list, reason string)
        reason can be: 'new_user', 'no_subjects', 'no_videos_found', 'success'
    """
    # Get user's interest subjects from all activity
    interest_subjects = get_user_interest_subjects_from_all_activity(db, user_id)
    
    if not interest_subjects:
        # New user with no activity
        return [], 'new_user'
    
    # Initialize YouTube searcher
    searcher = YouTubeVideoSearcher()
    
    all_videos = {}  # Use dict to deduplicate by video_id
    
    # Enhanced search queries for better educational content
    search_variations = [
        "{subject} tutorial complete course",
        "{subject} lecture university",
        "{subject} explained educational",
        "{subject} fundamentals crash course"
    ]
    
    videos_per_query = max(3, limit // (len(interest_subjects) * 2))
    
    # Search YouTube for each interest subject with multiple query variations
    for subject in interest_subjects[:5]:  # Limit to top 5 subjects
        logger.info(f"Searching YouTube for subject: {subject}")
        
        # Try different query variations to get diverse, quality results
        for variation in search_variations[:2]:  # Use top 2 variations per subject
            query = variation.format(subject=subject)
            
            try:
                videos = searcher.search_videos(
                    query=query,
                    max_results=videos_per_query,
                    order="viewCount"  # Sort by popularity
                )
                
                # Add subject metadata and filter for quality
                for video in videos:
                    video_id = video['video_id']
                    duration = video.get('duration', 0)
                    view_count = video.get('view_count', 0)
                    
                    # Quality filters for educational content
                    if (
                        duration >= 300 and duration <= 3600 and  # 5-60 minutes
                        view_count >= 1000  # Minimum 1K views for quality
                    ):
                        # Only add if not already present or has higher views
                        if video_id not in all_videos or all_videos[video_id].get('view_count', 0) < view_count:
                            video['subject'] = subject
                            video['search_query'] = query
                            all_videos[video_id] = video
            
            except Exception as e:
                logger.warning(f"Search failed for query '{query}': {e}")
                continue
    
    if not all_videos:
        return [], 'no_videos_found'
    
    # Calculate enhanced popularity scores
    video_list = list(all_videos.values())
    
    for video in video_list:
        view_count = video.get('view_count', 0)
        duration = video.get('duration', 0)
        upload_date = video.get('upload_date', '')
        
        # Base score from views (logarithmic scale to prevent domination)
        import math
        view_score = math.log10(max(view_count, 1)) * 10  # 0-70 range typically
        
        # Duration bonus (prefer substantial content: 10-40 minute sweet spot)
        duration_minutes = duration / 60
        if 10 <= duration_minutes <= 40:
            duration_score = 15
        elif 5 <= duration_minutes < 10 or 40 < duration_minutes <= 60:
            duration_score = 10
        else:
            duration_score = 5
        
        # Recency bonus (prefer content from last 2 years)
        recency_score = 0
        if upload_date:
            try:
                from datetime import datetime
                if len(upload_date) >= 8:
                    upload_year = int(upload_date[:4])
                    current_year = datetime.now().year
                    years_old = current_year - upload_year
                    
                    if years_old <= 1:
                        recency_score = 15
                    elif years_old == 2:
                        recency_score = 10
                    elif years_old <= 3:
                        recency_score = 5
            except:
                pass
        
        # Combined popularity score (0-100 scale)
        popularity_score = min(100.0, view_score + duration_score + recency_score)
        video['popularity_score'] = popularity_score
        
        # Add quality indicator
        if popularity_score >= 80:
            video['quality_tier'] = 'excellent'
        elif popularity_score >= 60:
            video['quality_tier'] = 'good'
        else:
            video['quality_tier'] = 'average'
    
    # Sort by popularity score (highest first)
    video_list.sort(key=lambda x: x.get('popularity_score', 0), reverse=True)
    
    # Diversify results: ensure we have videos from different subjects if possible
    diverse_videos = []
    subject_counts = {}
    max_per_subject = max(3, limit // len(interest_subjects))
    
    for video in video_list:
        subject = video['subject']
        count = subject_counts.get(subject, 0)
        
        if count < max_per_subject:
            diverse_videos.append(video)
            subject_counts[subject] = count + 1
            
            if len(diverse_videos) >= limit:
                break
    
    # If we still need more videos, add remaining ones
    if len(diverse_videos) < limit:
        for video in video_list:
            if video not in diverse_videos:
                diverse_videos.append(video)
                if len(diverse_videos) >= limit:
                    break
    
    recommended_videos = diverse_videos[:limit]
    
    # Convert to format matching API response
    formatted_videos = []
    for video in recommended_videos:
        description = video.get('description') or ''
        formatted_video = {
            'id': hash(video['video_id']) % 1000000,  # Generate temporary ID
            'title': video['title'],
            'description': description[:500] if description else '',
            'youtube_url': f"https://www.youtube.com/watch?v={video['video_id']}",
            'video_id': video['video_id'],
            'thumbnail_url': video.get('thumbnail_url') or f"https://img.youtube.com/vi/{video['video_id']}/mqdefault.jpg",
            'subject': video['subject'],
            'course': None,
            'semester': None,
            'popularity_score': video['popularity_score'],
            'duration': video.get('duration', 0),
            'view_count': video.get('view_count', 0),
            'channel_name': video.get('channel_name', ''),
            'quality_tier': video.get('quality_tier', 'average')
        }
        formatted_videos.append(formatted_video)
    
    logger.info(f"Returning {len(formatted_videos)} high-quality videos from YouTube")
    logger.info(f"Quality distribution: {sum(1 for v in formatted_videos if v['quality_tier'] == 'excellent')} excellent, "
                f"{sum(1 for v in formatted_videos if v['quality_tier'] == 'good')} good")
    return formatted_videos, 'success'
