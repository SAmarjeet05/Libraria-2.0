from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.models.book import Book
from app.models.user import User
from app.models.borrow_record import BorrowRecord, BorrowStatus
from app.models.ebook_issue import EbookIssue

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/", response_model=dict)
def get_reports(db: Session = Depends(get_db)):
    """Return dashboard metrics and simple aggregates for reports view."""
    # Total books
    total_books = db.query(Book).count()

    # Active members
    active_members = db.query(User).filter(User.is_active == True).count()

    # Total borrow records (issued ever)
    books_issued = db.query(BorrowRecord).count()

    # Overdue books (status == OVERDUE)
    overdue_books = db.query(BorrowRecord).filter(BorrowRecord.status == BorrowStatus.OVERDUE).count()

    # Most popular books (by issues)
    popular_q = (
        db.query(Book.title, func.count(BorrowRecord.id).label('issues'))
        .join(BorrowRecord, BorrowRecord.book_id == Book.id)
        .group_by(Book.id)
        .order_by(desc('issues'))
        .limit(10)
    )
    popular_books = [ {"title": row[0], "issues": int(row[1])} for row in popular_q.all() ]

    # Daily trends (group by year-month-day) - LAST 7 DAYS
    day_q = (
        db.query(func.strftime('%Y-%m-%d', BorrowRecord.borrowed_at).label('day'), func.count(BorrowRecord.id))
        .filter(BorrowRecord.borrowed_at >= func.datetime('now', '-7 days'))
        .group_by('day')
        .order_by('day')
    ).all()
    daily_trends = [{"day": r[0], "count": int(r[1])} for r in day_q]
    # Helper: take most recent two months from monthly_trends for change calculations
    def pct_change_from_series(series):
        # series: list of dict {month, count} ordered by month ascending
        if not series:
            return None
        if len(series) == 1:
            # no previous month to compare
            return None
        latest = series[-1]["count"]
        prev = series[-2]["count"]
        try:
            if prev == 0:
                return None if latest == 0 else 100.0
            return round(((latest - prev) / float(prev)) * 100.0, 1)
        except Exception:
            return None

    # Monthly borrow trends is already for BorrowRecord
    # compute day-over-day percent for borrow counts
    books_issued_change_pct = pct_change_from_series(daily_trends)

    # Monthly new users (by created_at) - get LAST 7 DAYS
    users_day_q = (
        db.query(func.strftime('%Y-%m-%d', User.created_at).label('day'), func.count(User.id))
        .filter(User.created_at >= func.datetime('now', '-7 days'))
        .group_by('day')
        .order_by('day')
    ).all()
    users_daily = [{"day": r[0], "count": int(r[1])} for r in users_day_q]
    active_members_change_pct = pct_change_from_series(users_daily)

    # Monthly new books - LAST 7 DAYS
    # Use `added_at` on Book model (created_at doesn't exist)
    books_day_q = (
        db.query(func.strftime('%Y-%m-%d', Book.added_at).label('day'), func.count(Book.id))
        .filter(Book.added_at >= func.datetime('now', '-7 days'))
        .group_by('day')
        .order_by('day')
    ).all()
    books_daily = [{"day": r[0], "count": int(r[1])} for r in books_day_q]
    total_books_change_pct = pct_change_from_series(books_daily)

    # Overdue change: LAST 7 DAYS
    overdue_day_q = (
        db.query(func.strftime('%Y-%m-%d', BorrowRecord.borrowed_at).label('day'), func.count(BorrowRecord.id))
        .filter(BorrowRecord.status == BorrowStatus.OVERDUE)
        .filter(BorrowRecord.borrowed_at >= func.datetime('now', '-7 days'))
        .group_by('day')
        .order_by('day')
    ).all()
    overdue_daily = [{"day": r[0], "count": int(r[1])} for r in overdue_day_q]
    overdue_books_change_pct = pct_change_from_series(overdue_daily)

    return {
        "total_books": int(total_books),
        "total_books_change_pct": total_books_change_pct,
        "active_members": int(active_members),
        "active_members_change_pct": active_members_change_pct,
        "books_issued": int(books_issued),
        "books_issued_change_pct": books_issued_change_pct,
        "overdue_books": int(overdue_books),
        "overdue_books_change_pct": overdue_books_change_pct,
        "popular_books": popular_books,
        "daily_trends": daily_trends,
        # include the daily series for users/books/overdue for potential frontend use
        "users_daily": users_daily,
        "books_daily": books_daily,
        "overdue_daily": overdue_daily,
        # New trend data for analytics graphs
        "book_issues_trend": daily_trends,
        "new_books_trend": books_daily,
        "member_registrations_trend": users_daily,
    }


@router.get('/book_issues', response_model=list)
def get_book_issues(db: Session = Depends(get_db)):
    """Return issue counts for all books as a list of {book_id, issues, title}.
    This is used by the frontend to display accurate issue counts per book.
    """
    q = (
        db.query(Book.id, Book.title, func.count(BorrowRecord.id).label('issues'))
        .outerjoin(BorrowRecord, BorrowRecord.book_id == Book.id)
        .group_by(Book.id)
    ).all()
    return [ { 'book_id': str(row[0]), 'title': row[1], 'issues': int(row[2]) } for row in q ]


@router.get('/ebook_issues_by_book/{book_id}', response_model=list)
def get_ebook_issues_by_book(book_id: str, db: Session = Depends(get_db)):
    """Return daily ebook issue counts for a specific book over the last 90 days.
    Returns list of {date, count} ordered by date ascending for charting.
    """
    q = (
        db.query(
            func.strftime('%Y-%m-%d', EbookIssue.issued_at).label('date'),
            func.count(EbookIssue.id).label('count')
        )
        .filter(EbookIssue.book_id == book_id)
        .filter(EbookIssue.issued_at >= func.datetime('now', '-90 days'))
        .group_by('date')
        .order_by('date')
    ).all()
    return [{'date': row[0], 'count': int(row[1])} for row in q]
