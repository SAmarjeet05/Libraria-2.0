"""Import models so Base.metadata picks them up when creating tables."""
from .user import User  # existing
from .book import Book
from .borrow_record import BorrowRecord

# New models
from .book_review import BookReview
from .book_request import BookRequest
from .system_log import SystemLog
from .community_post import CommunityPost
from .community_comment import CommunityComment
from .post_like import PostLike
from .tag import Tag
from .ebook_issue import EbookIssue
from .notes import Note
from .notes_review import NotesReview
from .notes_access_log import NotesAccessLog
from .notes_report import NotesReport
from .notes_recommendation import NotesRecommendation
from .notes_ai_log import NotesAILog
from .book_view import BookView
from .book_popularity_cache import BookPopularityCache

__all__ = [
    "User",
    "Book",
    "BorrowRecord",
    "BookReview",
    "BookRequest",
    "SystemLog",
    "CommunityPost",
    "CommunityComment",
    "PostLike",
    "Tag",
    "EbookIssue",
    "Note",
    "NotesReview",
    "NotesAccessLog",
    "NotesReport",
    "NotesRecommendation",
    "NotesAILog",
    "BookView",
    "BookPopularityCache",
]
