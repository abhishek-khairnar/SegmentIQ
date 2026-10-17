from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, SegmentationRun, Segment, Assignment
from app.schemas import CompareResponse
from app.deps import get_current_user
from app.services.compare import compare_runs_service

router = APIRouter(tags=["compare"])

@router.get("/compare", response_model=CompareResponse)
def compare_two_runs(
    a: str = Query(..., description="First run ID"),
    b: str = Query(..., description="Second run ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if a == b:
        raise HTTPException(status_code=400, detail="Please select two distinct segmentation runs to compare.")

    run_a = db.query(SegmentationRun).filter(SegmentationRun.id == a, SegmentationRun.user_id == current_user.id).first()
    run_b = db.query(SegmentationRun).filter(SegmentationRun.id == b, SegmentationRun.user_id == current_user.id).first()

    if not run_a:
        raise HTTPException(status_code=404, detail=f"Run '{a}' not found.")
    if not run_b:
        raise HTTPException(status_code=404, detail=f"Run '{b}' not found.")

    if run_a.dataset_id != run_b.dataset_id:
        raise HTTPException(status_code=400, detail="Runs must originate from the same dataset to be compared.")

    if run_a.status != "done" or run_b.status != "done":
        raise HTTPException(status_code=400, detail="Both segmentation runs must have completed successfully before comparing.")

    segs_a = db.query(Segment).filter(Segment.run_id == run_a.id).all()
    segs_b = db.query(Segment).filter(Segment.run_id == run_b.id).all()

    assignments_a = db.query(Assignment).filter(Assignment.run_id == run_a.id).all()
    assignments_b = db.query(Assignment).filter(Assignment.run_id == run_b.id).all()

    try:
        res = compare_runs_service(
            run_a=run_a,
            run_b=run_b,
            segments_a=segs_a,
            segments_b=segs_b,
            assignments_a=assignments_a,
            assignments_b=assignments_b
        )
        return CompareResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
