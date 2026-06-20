from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from app.models.notes import Note
from app.models.notes_access_log import NotesAccessLog
from sqlalchemy import func


def get_user_interest_subjects(db: Session, user_id: str) -> List[str]:
    """Extract subjects/courses from notes the user has viewed or downloaded.
    
    Returns a list of unique subjects the user has interacted with.
    """
    result = db.query(func.distinct(Note.subject)).join(
        NotesAccessLog,
        Note.id == NotesAccessLog.note_id
    ).filter(
        NotesAccessLog.user_id == user_id,
        Note.status == 'approved'
    ).all()
    
    # Filter out None values and return
    return [subject[0] for subject in result if subject[0]]


def get_user_viewed_notes(db: Session, user_id: str) -> List[int]:
    """Get all note IDs that the user has already viewed or interacted with.
    
    Returns a list of note IDs to exclude from recommendations.
    """
    result = db.query(func.distinct(NotesAccessLog.note_id)).filter(
        NotesAccessLog.user_id == user_id
    ).all()
    
    return [note_id[0] for note_id in result]


def get_user_activity_count(db: Session, user_id: str) -> dict:
    """Count user interactions with notes across all action types.
    
    Returns a dict with view and download counts.
    """
    total_views = db.query(func.count(NotesAccessLog.id)).filter(
        NotesAccessLog.user_id == user_id,
        NotesAccessLog.action == 'viewed'
    ).scalar() or 0
    
    total_downloads = db.query(func.count(NotesAccessLog.id)).filter(
        NotesAccessLog.user_id == user_id,
        NotesAccessLog.action == 'downloaded'
    ).scalar() or 0
    
    return {
        'views': total_views,
        'downloads': total_downloads,
        'total': total_views + total_downloads
    }


def get_recommended_notes(
    db: Session, 
    user_id: str, 
    limit: int = 8
) -> Tuple[List[Note], str]:
    """Get personalized recommended notes for the user.
    
    Algorithm:
    1. Get user's interest subjects from their viewing history
    2. Get approved notes in those subjects
    3. Exclude notes already viewed by the user
    4. Sort by popularity (view count, download count)
    5. Return top N notes
    
    Returns:
        tuple of (notes list, reason string)
        reason can be: 'new_user', 'no_subjects', 'no_notes_in_subjects', 'success'
    """
    # Get user's interest subjects
    interest_subjects = get_user_interest_subjects(db, user_id)
    
    if not interest_subjects:
        # New user with no activity
        return [], 'new_user'
    
    # Get notes already viewed by user
    viewed_note_ids = get_user_viewed_notes(db, user_id)
    
    # Query for recommended notes
    query = db.query(Note).filter(
        Note.status == 'approved',
        Note.subject.in_(interest_subjects),
        ~Note.id.in_(viewed_note_ids) if viewed_note_ids else True
    )
    
    # Sort by popularity: first by view count, then by download count
    from sqlalchemy import and_
    from sqlalchemy.orm import aliased
    
    # Count views and downloads for each note
    view_count = db.query(func.count(NotesAccessLog.id)).filter(
        NotesAccessLog.note_id == Note.id,
        NotesAccessLog.action == 'viewed'
    ).correlate(Note).scalar_subquery()
    
    download_count = db.query(func.count(NotesAccessLog.id)).filter(
        NotesAccessLog.note_id == Note.id,
        NotesAccessLog.action == 'downloaded'
    ).correlate(Note).scalar_subquery()
    
    # Order by combined popularity score
    query = query.order_by(
        (func.coalesce(view_count, 0) * 0.4 + 
         func.coalesce(download_count, 0) * 0.6).desc()
    )
    
    recommended_notes = query.limit(limit).all()
    
    if not recommended_notes:
        return [], 'no_notes_in_subjects'
    
    return recommended_notes, 'success'
