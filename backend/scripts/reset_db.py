import sys
import os

# Add the parent directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, engine, SessionLocal
from app.models.user import User
from app.crud.crud_user import create_user
from app.schemas.user import UserCreate
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        logger.info("Dropped all existing tables")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Created all tables")
        
        # Create admin user
        db = SessionLocal()
        try:
            admin_data = UserCreate(
                email="admin@libraria.com",
                password="admin123",  # Change this in production
                full_name="System Admin",
                role="Admin"
            )
            create_user(db, admin_data)
            logger.info("Created admin user")
        finally:
            db.close()
            
        logger.info("Database reset completed successfully")
        
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        raise

if __name__ == "__main__":
    logger.info("Starting database reset...")
    reset_database()