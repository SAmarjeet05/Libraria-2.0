from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID

from ..models.book import Book
from ..models.book_review import BookReview
from ..schemas.book import BookCreate, BookUpdate

def get_book(db: Session, book_id: UUID) -> Optional[Book]:
    return db.query(Book).filter(Book.id == book_id).first()

def get_book_by_isbn(db: Session, isbn: str) -> Optional[Book]:
    return db.query(Book).filter(Book.isbn == isbn).first()

def get_books(db: Session, skip: int = 0, limit: int = 100) -> List[dict]:
    books = db.query(Book).offset(skip).limit(limit).all()
    result = []
    for book in books:
        book_dict = book.to_dict()
        # Calculate average rating from reviews
        avg_rating = db.query(func.avg(BookReview.rating)).filter(
            BookReview.book_id == str(book.id)
        ).scalar()
        book_dict['avg_rating'] = float(avg_rating) if avg_rating else 0.0
        result.append(book_dict)
    return result

def create_book(db: Session, book: BookCreate) -> Book:
    book_data = book.dict()
    # Set available copies equal to total copies initially
    book_data["available_copies"] = book_data["total_copies"]
    book_data["status"] = "available"
    
    db_book = Book(**book_data)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

def update_book(db: Session, book_id: UUID, book: BookUpdate) -> Optional[Book]:
    db_book = get_book(db, book_id)
    if not db_book:
        return None
    
    for key, value in book.dict(exclude_unset=True).items():
        setattr(db_book, key, value)
    
    db.commit()
    db.refresh(db_book)
    return db_book

def delete_book(db: Session, book_id: UUID) -> bool:
    db_book = get_book(db, book_id)
    if not db_book:
        return False
    
    db.delete(db_book)
    db.commit()
    return True