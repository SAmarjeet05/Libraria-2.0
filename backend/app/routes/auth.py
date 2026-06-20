from typing import Any
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Security
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.crud import crud_user
from app.schemas.user import UserCreate
from app.schemas.token import Token, TokenPayload
from fastapi.encoders import jsonable_encoder
from app.models.user import UserStatus

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Security(oauth2_scheme)
) -> TokenPayload:
    try:
        if not token:
            logger.warning("No authentication token provided")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token missing"
            )

        logger.info(f"Authenticating token: {token[:10]}...")
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        logger.info(f"Token decoded successfully: {payload}")
        
        # Get user from database to check current role
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("No user ID in token")
            
        user = crud_user.get_by_id(db, user_id)
        if not user:
            raise ValueError("User not found")
        # If account is deleted, refuse to authenticate using existing tokens
        try:
            from app.models.user import UserStatus
            if getattr(user, 'status', None) is not None and str(user.status).lower() == str(UserStatus.DELETED):
                raise ValueError('User account has been deleted')
        except Exception:
            # if UserStatus import fails or attribute missing, continue
            pass
            
        # Create token payload with current user data
        token_data = TokenPayload(
            user_id=str(user.id),  # Convert UUID to string
            is_admin=(user.role == "admin")  # Set admin status based on role
        )
        logger.info(f"Created token payload: {token_data}")
        return token_data
    except JWTError as e:
        logger.error(f"JWT Error: {str(e)}")
        logger.exception("JWT decoding failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
    except Exception as e:
        logger.exception("Unexpected authentication error")
        # If this is already an HTTPException, re-raise it to preserve status/detail
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
        )

@router.post("/login", response_model=dict)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Login endpoint for user authentication
    """
    user = crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    # Prevent login for deleted accounts and inactive users
    elif getattr(user, 'status', None) is not None and str(user.status).lower() == str(UserStatus.DELETED):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account deleted")
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )

    # Update last login time
    user = crud_user.update_last_login(db, user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Create token payload with user ID and admin status
    token_data = {
        "sub": str(user.id),
        "exp": datetime.utcnow() + access_token_expires,
        "is_admin": user.role == "admin"  # Check role for admin status
    }
    access_token = jwt.encode(
        token_data,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    # Add admin status to user data
    user_data = user.to_dict()
    user_data["is_admin"] = user.role == "admin"
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": jsonable_encoder(user_data)
    }

@router.post("/register", response_model=dict)
async def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    request: Request = None,
) -> Any:
    """
    Register endpoint for creating new users
    """
    try:
        logger.info(f"Registration attempt for email: {user_in.email}")
        
        user = crud_user.get_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
            
        logger.info("Checking username availability...")
    
        user = crud_user.get_by_username(db, username=user_in.username)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )
        
        logger.info("Creating new user...")
        user = crud_user.create(db, obj_in=user_in)
        logger.info(f"User created successfully with ID: {user.id}")
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            user.id, expires_delta=access_token_expires
        )
        
        user_data = user.to_dict()
        user_data["is_admin"] = user.role == "admin"  # Add explicit is_admin field
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": jsonable_encoder(user_data)
        }
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration. Please try again."
        )


@router.get("/me", response_model=dict)
def get_me(db: Session = Depends(get_db), token: TokenPayload = Depends(get_current_user)):
    """Return current user info for the provided token (useful for debugging)."""
    try:
        user = crud_user.get_by_id(db, token.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        ud = user.to_dict()
        ud["is_admin"] = user.role == "admin"
        return jsonable_encoder(ud)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to return current user")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))