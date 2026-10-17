from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import ContactMessage, User
from app.schemas import ContactResponse, ContactPatch
from app.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/messages", response_model=List[ContactResponse])
def get_all_messages(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    messages = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
    return messages

@router.patch("/messages/{message_id}", response_model=ContactResponse)
def update_message_status(
    message_id: str,
    patch: ContactPatch,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    msg.is_read = patch.is_read
    db.commit()
    db.refresh(msg)
    return msg

@router.delete("/messages/{message_id}")
def delete_message(
    message_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    db.delete(msg)
    db.commit()
    return {"message": "Message successfully deleted."}
