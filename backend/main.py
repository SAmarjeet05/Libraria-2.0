from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import (
    auth, books, categories, borrows, users, reviews, requests, 
    community, tags, reports, ai, notes, wishlist, proxy, ebook_issues, book_views, recommendations,
    notes_recommendations, youtube_recommendations
)
from app.routes import notes_ai
from app.core.database import Base, engine, DB_PATH
from sqlalchemy.orm import Session
import os
import pathlib
import logging
import asyncio
from datetime import datetime
from app.core.database import SessionLocal
from app.models.ebook_issue import EbookIssue

# Load environment variables
try:
    from dotenv import load_dotenv
    project_root = pathlib.Path(__file__).resolve().parents[1]
    load_dotenv(project_root / ".env")
except:
    pass

# MEGA Credentials
MEGA_EMAIL = os.getenv("MEGA_EMAIL")
MEGA_PASSWORD = os.getenv("MEGA_PASSWORD")

# MEGA Python SDK
from mega import Mega
mega_client = None  # will be initialized in startup


# Create FastAPI app
app = FastAPI(
    title="Libraria API",
    version="1.0.0",
    description="Backend API for Libraria application"
)


# Startup: initialize DB and MEGA login
@app.on_event("startup")
async def init_startup():
    global mega_client

    # Initialize DB
    try:
        Base.metadata.create_all(bind=engine)

        if os.path.exists(DB_PATH):
            os.chmod(DB_PATH, 0o666)
            print(f"Database initialized at: {DB_PATH}")

    except Exception as e:
        print(f"Error initializing database: {e}")
        raise

    # Initialize MEGA Login once
    try:
        if MEGA_EMAIL and MEGA_PASSWORD:
            mega = Mega()
            mega_client = mega.login(MEGA_EMAIL, MEGA_PASSWORD)
            print("Successfully logged in to MEGA (Python SDK)")
        else:
            print("MEGA_EMAIL or MEGA_PASSWORD not found in .env")
    except Exception as e:
        print(f"MEGA login failed: {e}")

    # Start background worker to auto-revoke expired ebook issues
    async def expiry_worker():
        # Runs forever in background; revokes any active issues whose expiry_date <= now
        while True:
            try:
                db = SessionLocal()
                now = datetime.utcnow()
                expired = db.query(EbookIssue).filter(EbookIssue.status == 'active', EbookIssue.expiry_date != None, EbookIssue.expiry_date <= now).all()
                if expired:
                    for rec in expired:
                        rec.status = 'revoked'
                    db.commit()
                    print(f"Auto-revoked {len(expired)} expired ebook issue(s)")
            except Exception as e:
                print(f"Expiry worker error: {e}")
            finally:
                try:
                    db.close()
                except Exception:
                    pass
            await asyncio.sleep(60)  # check every 60 seconds

    # Schedule the expiry worker as a background task (daemon-like)
    try:
        asyncio.create_task(expiry_worker())
        print("Started ebook expiry background worker")
    except Exception as e:
        print(f"Failed to start expiry background worker: {e}")


# CORS
app.add_middleware(
    CORSMiddleware,
    # Restrict to known dev origins so credentialed requests (Authorization header / cookies)
    # are accepted by browsers. Using "*" with allow_credentials=True can cause browsers
    # to reject responses.
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


# Include all routers
app.include_router(auth.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(borrows.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(requests.router, prefix="/api")
app.include_router(community.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(notes_ai.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(proxy.router, prefix="/api")
app.include_router(ebook_issues.router, prefix="/api")
app.include_router(book_views.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(notes_recommendations.router, prefix="/api")
app.include_router(youtube_recommendations.router, prefix="/api")


# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Dev helper: list registered routes (only enabled in development)
@app.get("/api/debug/routes")
def list_routes():
    return [{"path": r.path, "methods": list(r.methods)} for r in app.routes]


# Run server
if __name__ == "__main__":
    import uvicorn

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("uvicorn")
    logger.info("Starting Libraria Server")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )
