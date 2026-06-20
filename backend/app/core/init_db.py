from app.core.database import Base, engine, SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
import logging

# Set up logging
logger = logging.getLogger(__name__)

def create_admin():
    """Create admin user if it doesn't exist"""
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            # Create admin user
            admin = User(
                username="kshitiz verma",
                email="kshitizamarjeet@gmail.com",
                password_hash=get_password_hash("kshitizverma"),  # Change this password!
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                full_name="System Administrator"
            )
            db.add(admin)
            db.commit()
            logger.info("Admin user created successfully")
            print("Admin user created with:")
            print("Username: kshitiz verma")
            print("Password: kshitizverma")
        else:
            logger.info("Admin user already exists")
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    """Create database tables if they don't exist"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        # Create admin user
        create_admin()
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Initializing database...")
    init_db()