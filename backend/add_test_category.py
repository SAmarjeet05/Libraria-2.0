from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.category import Category

def add_test_category():
    # Create a session
    session = Session(engine)
    
    try:
        # Create a blank category
        test_category = Category(
            name="Test Category",
            description="A test category"
        )
        
        # Add to database
        session.add(test_category)
        session.commit()
        
        print("Test category added successfully!")
        
    except Exception as e:
        print(f"Error adding test category: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    add_test_category()