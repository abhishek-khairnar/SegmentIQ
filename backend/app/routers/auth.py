from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.db import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, UserResponse, UserPatch, UserChangePassword
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.config import settings

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("15/minute")
def register(request: Request, user_in: UserRegister, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    is_admin = user_in.email.lower() == settings.ADMIN_EMAIL.lower()
    user = User(
        email=user_in.email.lower(),
        name=user_in.name.strip(),
        password_hash=hash_password(user_in.password),
        role="admin" if is_admin else "user",
        theme="system"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return user

@router.post("/login", response_model=UserResponse)
@limiter.limit("20/minute")
def login(request: Request, creds: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email.lower()).first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user.email.lower() == settings.ADMIN_EMAIL.lower() and user.role != "admin":
        user.role = "admin"
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id})
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return user

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=settings.COOKIE_NAME)
    return {"message": "Successfully logged out."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def patch_me(user_patch: UserPatch, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_patch.name is not None:
        current_user.name = user_patch.name.strip()
    if user_patch.theme is not None:
        if user_patch.theme in ["light", "dark", "system"]:
            current_user.theme = user_patch.theme
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(data: UserChangePassword, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match.")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}

@router.delete("/me")
def delete_me(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    response.delete_cookie(key=settings.COOKIE_NAME)
    return {"message": "Account and all associated datasets have been permanently deleted."}
