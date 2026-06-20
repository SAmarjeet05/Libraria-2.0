import os
import sys
import logging
import time
from pathlib import Path
import sqlite3

# Add the parent directory to Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from sqlalchemy import text
from app.core.database import Base, engine, get_db, DB_FILE
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.crud.crud_user import create_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ensure_directory_exists():
    """Ensure the directory for the database exists"""
    db_dir = os.path.dirname(DB_FILE)
    os.makedirs(db_dir, exist_ok=True)

def remove_existing_db():
    """Safely remove existing database file"""
    if os.path.exists(DB_FILE):
        logger.info(f"Removing existing database: {DB_FILE}")
        try:
            # Close all database connections
            engine.dispose()
            
            # Make file writable if needed
            os.chmod(DB_FILE, 0o666)
            
            # Remove file
            os.remove(DB_FILE)
            time.sleep(1)  # Wait for filesystem
            
        except Exception as e:
            logger.error(f"Error removing database: {e}")
            raise

def create_tables():
    """Create all database tables"""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)

def create_admin_user(db):
    """Create initial admin user"""
    try:
        admin_data = UserCreate(
            email="admin@libraria.com",
            password="admin123",  # Change this in production!
            username="admin",
            full_name="System Administrator",
            role=UserRole.ADMIN
        )
        
        admin = create_user(db, admin_data)
        logger.info(f"Created admin user with ID: {admin.id}")
        
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        db.rollback()
        raise

def verify_database():
    """Verify database is readable"""
    try:
        # Use SQLAlchemy engine to verify
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
            tables = result.fetchall()
            logger.info(f"Created tables: {[table[0] for table in tables]}")
    except Exception as e:
        logger.error(f"Error verifying database: {e}")
        raise

def reset_database():
    """Main function to reset the database"""
    try:
        logger.info("Starting database reset...")
        
        # Ensure directory exists
        ensure_directory_exists()
        
        # Remove existing database
        remove_existing_db()
        
        # Create tables
        create_tables()
        
        # Create admin user
        db = next(get_db())
        try:
            create_admin_user(db)
        finally:
            db.close()
        
        # Verify database
        verify_database()
        
        # Set final permissions
        os.chmod(DB_FILE, 0o666)
        
        logger.info("Database reset completed successfully!")
        
    except Exception as e:
        logger.error(f"Database reset failed: {e}")
        raise

if __name__ == "__main__":
    reset_database()