from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, SegmentationRun, Segment, Assignment
from app.deps import get_current_user
from app.services.export import (
    export_customers_csv, export_segments_summary_csv,
    export_segment_audience_csv, export_run_json
)

router = APIRouter(prefix="/runs", tags=["export"])

@router.get("/{run_id}/export/customers.csv")
def download_customers_csv(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    segments = db.query(Segment).filter(Segment.run_id == run.id).all()
    seg_map = {s.id: s for s in segments}
    assignments = db.query(Assignment).filter(Assignment.run_id == run.id).all()

    csv_bytes = export_customers_csv(run, assignments, seg_map)
    safe_name = run.name.replace(" ", "_").lower()
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_customers.csv"'}
    )

@router.get("/{run_id}/export/segments.csv")
def download_segments_csv(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    segments = db.query(Segment).filter(Segment.run_id == run.id).all()
    csv_bytes = export_segments_summary_csv(segments)
    safe_name = run.name.replace(" ", "_").lower()
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_segments_summary.csv"'}
    )

@router.get("/{run_id}/export/run.json")
def download_run_json(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    segments = db.query(Segment).filter(Segment.run_id == run.id).all()
    assignments = db.query(Assignment).filter(Assignment.run_id == run.id).all()

    data = export_run_json(run, segments, assignments)
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f'attachment; filename="{run.name.replace(" ", "_").lower()}_full_run.json"'}
    )

@router.get("/{run_id}/export/segment/{segment_id}.csv")
def download_segment_audience_csv(
    run_id: str,
    segment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    segment = db.query(Segment).filter(Segment.id == segment_id, Segment.run_id == run.id).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found.")

    assignments = db.query(Assignment).filter(Assignment.run_id == run.id, Assignment.segment_id == segment.id).all()
    csv_bytes = export_segment_audience_csv(segment, assignments)

    safe_seg_name = segment.name.replace(" ", "_").lower()
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="audience_{safe_seg_name}.csv"'}
    )
