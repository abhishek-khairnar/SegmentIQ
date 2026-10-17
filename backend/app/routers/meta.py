import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import get_db
from app.models import User, Dataset, SegmentationRun
from app.schemas import DashboardSummary, RunResponse
from app.deps import get_current_user

router = APIRouter(tags=["meta"])

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": "SegmentIQ",
        "version": "1.0.0"
    }

@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    datasets_count = db.query(Dataset).filter(Dataset.user_id == current_user.id).count()
    runs_count = db.query(SegmentationRun).filter(SegmentationRun.user_id == current_user.id).count()

    total_customers = db.query(func.sum(SegmentationRun.n_customers)).filter(
        SegmentationRun.user_id == current_user.id,
        SegmentationRun.status == "done"
    ).scalar() or 0

    recent_runs_db = db.query(SegmentationRun).filter(
        SegmentationRun.user_id == current_user.id
    ).order_by(SegmentationRun.created_at.desc()).limit(5).all()

    last_run_date = recent_runs_db[0].created_at if recent_runs_db else None

    recent_runs = []
    for r in recent_runs_db:
        recent_runs.append(RunResponse(
            id=r.id,
            dataset_id=r.dataset_id,
            dataset_name=r.dataset.name if r.dataset else None,
            user_id=r.user_id,
            name=r.name,
            method=r.method,
            params_json=json.loads(r.params_json),
            features_json=json.loads(r.features_json),
            status=r.status,
            error_message=r.error_message,
            n_customers=r.n_customers,
            n_segments=r.n_segments,
            metrics_json=json.loads(r.metrics_json),
            duration_ms=r.duration_ms,
            created_at=r.created_at
        ))

    return DashboardSummary(
        datasets_count=datasets_count,
        runs_count=runs_count,
        customers_segmented=int(total_customers),
        last_run_date=last_run_date,
        recent_runs=recent_runs
    )
