from fastapi import Security, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.security import SECRET_KEY, ALGORITHM

# Reuse the same token URL as auth router
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

async def verify_admin(token: str = Depends(oauth2_scheme)):
    """
    Verifies that the user has a valid JWT token and is an admin.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        
        if username is None:
            raise credentials_exception
            
        if role != "admin":
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required",
            )
            
        return {"sub": username, "role": role}

    except JWTError:
        raise credentials_exception
