from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.db.database import get_db
from app.models.user import User
from app.core.security import create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password
from pydantic import BaseModel

router = APIRouter(tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")


# Hardcoded Admin Credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "***REMOVED***"

# Hardcoded Demo User
DEMO_USERNAME = "demo"
DEMO_PASSWORD = "***REMOVED***"

# Pydantic Schemas
class UserCreate(BaseModel):
    username: str
    password: str
    email: str
    role: str = "citizen" # default to citizen
    # Optional profile data
    occupation: str = None
    state: str = None
    age: int = None
    gender: str = None
    profile_pic: str = None

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

@router.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        # Create new user
        import random
        regions = ["North", "South", "East", "West", "Central"]
        assigned_region = random.choice(regions)

        hashed_pwd = get_password_hash(user.password)
        new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_pwd,
            role=user.role, # Keep original role from UserCreate
            occupation=user.occupation,
            state=user.state,
            age=user.age,
            gender=user.gender,
            profile_pic=user.profile_pic,
            region=assigned_region # Assign random region
        )
        
        # If role is citizen, generate a Unique ID (simple version for now)
        if user.role == "citizen":
            new_user.citizen_id = f"CIT-2024-{random.randint(10000, 99999)}"

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Generate Token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user.username, "role": new_user.role},
            expires_delta=access_token_expires
        )
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "role": new_user.role,
            "username": new_user.username
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Signup Error: {str(e)}")

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"DEBUG: Login Attempt for user: {form_data.username}", flush=True)
    try:
        # 1. Check for Hardcoded Admin
        if form_data.username == ADMIN_USERNAME:
            if form_data.password == ADMIN_PASSWORD:
                access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                # Role explicitly set to "admin"
                access_token = create_access_token(
                    data={"sub": ADMIN_USERNAME, "role": "admin"},
                    expires_delta=access_token_expires
                )
                return {
                    "access_token": access_token, 
                    "token_type": "bearer",
                    "role": "admin",
                    "username": ADMIN_USERNAME
                }

        # 2. Check for Hardcoded Demo User
        if form_data.username == DEMO_USERNAME:
            if form_data.password == DEMO_PASSWORD:
                access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                access_token = create_access_token(
                    data={"sub": DEMO_USERNAME, "role": "citizen"},
                    expires_delta=access_token_expires
                )
                return {
                    "access_token": access_token, 
                    "token_type": "bearer",
                    "role": "citizen",
                    "username": DEMO_USERNAME
                }

        user = db.query(User).filter(User.username == form_data.username).first()
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=access_token_expires
        )
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "role": user.role,
            "username": user.username
        }
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "role": user.role,
            "username": user.username
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login Error: {str(e)}")

@router.get("/me")
def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        from jose import JWTError, jwt, ExpiredSignatureError
        from app.core.security import SECRET_KEY, ALGORITHM
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise HTTPException(status_code=401, detail="Invalid credentials")
        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired. Please login again.")
        except JWTError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
            
        # Check if it's the hardcoded admin BEFORE DB query to avoid DB issues if admin not in DB
        if username == ADMIN_USERNAME:
            return {
                "username": ADMIN_USERNAME,
                "role": "admin",
                "citizen_id": "ADMIN-001",
                "occupation": "System Administrator"
            }

        # Check for Demo User
        if username == DEMO_USERNAME:
            return {
                "username": DEMO_USERNAME,
                "role": "citizen",
                "citizen_id": "DEMO-001",
                "occupation": "Demo Citizen",
                "state": "National",
                "age": 30,
                "gender": "Other",
                "profile_pic": None
            }

        user = db.query(User).filter(User.username == username).first()
        
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "username": user.username,
            "role": user.role,
            "citizen_id": user.citizen_id,
            "occupation": user.occupation,
            "state": user.state,
            "age": user.age,
            "gender": user.gender,
            "profile_pic": user.profile_pic
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
