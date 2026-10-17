from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.db import get_db
from app.models import ContactMessage
from app.schemas import ContactCreate, ContactResponse

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/contact", tags=["contact"])

@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def submit_contact_message(
    request: Request,
    data: ContactCreate,
    db: Session = Depends(get_db)
):
    msg = ContactMessage(
        name=data.name.strip(),
        email=data.email.lower(),
        subject=data.subject.strip(),
        message=data.message.strip(),
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
