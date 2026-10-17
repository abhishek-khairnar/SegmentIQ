import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from app.db import get_db, SessionLocal
from app.models import User, Dataset, SegmentationRun, Segment, Assignment
from app.schemas import (
    RunCreate, RunResponse, RunPatch, SegmentResponse, SegmentPatch,
    MapResponse, MapPoint, CustomersPage, CustomerItem
)
from app.deps import get_current_user
from app.services.rfm import (
    build_rfm_customer_table, compute_rfm_scores,
    RFM_SEGMENT_DEFINITIONS, SEGMENT_COLORS
)
from app.services.clustering import run_clustering

router = APIRouter(tags=["runs"])

def execute_segmentation_task(run_id: str):
    db: Session = SessionLocal()
    start_time = time.time()
    try:
        run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id).first()
        if not run:
            return

        run.status = "running"
        # Ensure idempotency
        db.query(Assignment).filter(Assignment.run_id == run.id).delete()
        db.query(Segment).filter(Segment.run_id == run.id).delete()
        db.commit()

        dataset = db.query(Dataset).filter(Dataset.id == run.dataset_id).first()
        if not dataset:
            raise ValueError("Associated dataset could not be found.")

        if not Path(dataset.file_path).exists():
            raise ValueError("Dataset storage file is missing.")

        df = pd.read_parquet(dataset.file_path)
        mapping = json.loads(dataset.mapping_json)
        params = json.loads(run.params_json)
        selected_features = json.loads(run.features_json)
        method = run.method.lower()

        if method == "rfm":
            # RFM Rule-Based Segmentation
            if dataset.source_type == "transactions":
                df_rfm, rfm_meta = build_rfm_customer_table(df, mapping)
            else:
                # Features source type
                cid_col = mapping.get("customer_id", df.columns[0])
                df_rfm = df.copy()
                df_rfm["customer_id"] = df_rfm[cid_col].astype(str)

                # Ensure recency_days, frequency, monetary exist or are mapped
                r_col = mapping.get("recency", "recency_days")
                f_col = mapping.get("frequency", "frequency")
                m_col = mapping.get("monetary", "monetary")

                if r_col not in df_rfm.columns or f_col not in df_rfm.columns or m_col not in df_rfm.columns:
                    raise ValueError("RFM requires 'recency', 'frequency', and 'monetary' columns to be present or mapped.")

                df_rfm["recency_days"] = pd.to_numeric(df_rfm[r_col], errors="coerce").fillna(30)
                df_rfm["frequency"] = pd.to_numeric(df_rfm[f_col], errors="coerce").fillna(1)
                df_rfm["monetary"] = pd.to_numeric(df_rfm[m_col], errors="coerce").fillna(10)
                df_rfm["avg_order_value"] = round(df_rfm["monetary"] / np.maximum(1, df_rfm["frequency"]), 2)
                df_rfm["tenure_days"] = df_rfm["recency_days"]

            # Compute RFM scores and segments
            df_scored, score_meta = compute_rfm_scores(df_rfm)

            # Standardize for PCA coordinates
            pca_features = ["recency_days", "frequency", "monetary"]
            if "avg_order_value" in df_scored.columns:
                pca_features.append("avg_order_value")

            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(df_scored[pca_features].fillna(0).values)
            pca = PCA(n_components=2, random_state=42)
            coords = pca.fit_transform(X_scaled)
            df_scored["pca_x"] = np.round(coords[:, 0], 3)
            df_scored["pca_y"] = np.round(coords[:, 1], 3)

            # Build Segment records
            overall_means = {col: float(df_scored[col].mean()) for col in pca_features}
            overall_stds = {col: float(df_scored[col].std()) if float(df_scored[col].std()) > 0 else 1.0 for col in pca_features}

            # Find active segments (only save segments with at least 1 customer)
            active_segment_names = sorted(df_scored["rfm_segment"].unique())
            seg_obj_map = {}

            for idx, seg_name in enumerate(active_segment_names):
                seg_df = df_scored[df_scored["rfm_segment"] == seg_name]
                size = len(seg_df)
                share_pct = round(size / len(df_scored) * 100, 2)
                color = SEGMENT_COLORS[idx % len(SEGMENT_COLORS)]

                seg_info = RFM_SEGMENT_DEFINITIONS.get(seg_name, {
                    "description": f"Customer group belonging to {seg_name}.",
                    "actions": ["Deliver personalized engagement campaigns", "Track segment retention", "Monitor order lifetime value"]
                })

                raw_means = {col: round(float(seg_df[col].mean()), 2) for col in pca_features}
                z_scores = {col: round(float((raw_means[col] - overall_means[col]) / overall_stds[col]), 3) for col in pca_features}
                index_ratios = {col: round(float(raw_means[col] / overall_means[col]), 2) if overall_means[col] != 0 else 1.0 for col in pca_features}

                profile_dict = {
                    "raw_means": raw_means,
                    "overall_means": {c: round(m, 2) for c, m in overall_means.items()},
                    "index_ratios": index_ratios,
                    "z_scores": z_scores
                }

                segment = Segment(
                    run_id=run.id,
                    index=idx,
                    name=seg_name,
                    description=seg_info["description"],
                    color=color,
                    size=size,
                    share_pct=share_pct,
                    centroid_json=json.dumps(raw_means),
                    profile_json=json.dumps(profile_dict),
                    actions_json=json.dumps(seg_info["actions"])
                )
                db.add(segment)
                db.flush()
                seg_obj_map[seg_name] = segment

            # Build Customer Assignments
            assignments_batch = []
            for _, r in df_scored.iterrows():
                s_name = r["rfm_segment"]
                s_obj = seg_obj_map[s_name]
                feat_dict = {col: round(float(r[col]), 2) if isinstance(r[col], (int, float, np.number)) else str(r[col]) for col in pca_features}
                feat_dict["r_score"] = int(r["r_score"])
                feat_dict["f_score"] = int(r["f_score"])
                feat_dict["m_score"] = int(r["m_score"])

                assignments_batch.append(Assignment(
                    run_id=run.id,
                    segment_id=s_obj.id,
                    customer_id=str(r["customer_id"]),
                    features_json=json.dumps(feat_dict),
                    pca_x=float(r["pca_x"]),
                    pca_y=float(r["pca_y"])
                ))
            db.bulk_save_objects(assignments_batch)

            run.n_customers = len(df_scored)
            run.n_segments = len(active_segment_names)
            run.features_json = json.dumps(pca_features)
            run.metrics_json = json.dumps({
                "rfm_quantiles": score_meta.get("quantiles_used", 5),
                "pca_variance_ratio": [round(float(v), 4) for v in pca.explained_variance_ratio_],
                "active_segments_count": len(active_segment_names)
            })

        else:
            # ML Clustering: K-Means, Hierarchical, DBSCAN
            if dataset.source_type == "transactions":
                df_rfm, _ = build_rfm_customer_table(df, mapping)
                df_to_cluster = df_rfm
                cid_col = "customer_id"
                if not selected_features:
                    selected_features = ["recency_days", "frequency", "monetary", "avg_order_value"]
            else:
                df_to_cluster = df.copy()
                cid_col = mapping.get("customer_id", df.columns[0])
                if not selected_features:
                    selected_features = mapping.get("feature_columns", [c for c in df.columns if c != cid_col])

            res = run_clustering(
                df=df_to_cluster,
                customer_id_col=cid_col,
                feature_cols=selected_features,
                method=method,
                params=params,
                apply_log=params.get("log_transform", True),
                apply_cap=params.get("cap_outliers", True)
            )

            # Persist Segments
            seg_idx_to_id = {}
            for s_data in res["segments"]:
                seg = Segment(
                    run_id=run.id,
                    index=s_data["index"],
                    name=s_data["name"],
                    description=s_data["description"],
                    color=s_data["color"],
                    size=s_data["size"],
                    share_pct=s_data["share_pct"],
                    centroid_json=json.dumps(s_data["centroid_json"]),
                    profile_json=json.dumps(s_data["profile_json"]),
                    actions_json=json.dumps(s_data["actions_json"])
                )
                db.add(seg)
                db.flush()
                seg_idx_to_id[s_data["index"]] = seg.id

            # Persist Assignments
            assignments_batch = []
            for a_data in res["assignments"]:
                assignments_batch.append(Assignment(
                    run_id=run.id,
                    segment_id=seg_idx_to_id[a_data["segment_index"]],
                    customer_id=a_data["customer_id"],
                    features_json=json.dumps(a_data["features"]),
                    pca_x=a_data["pca_x"],
                    pca_y=a_data["pca_y"]
                ))
            db.bulk_save_objects(assignments_batch)

            run.n_customers = res["n_customers"]
            run.n_segments = res["n_segments"]
            run.features_json = json.dumps(selected_features)
            run.metrics_json = json.dumps(res["metrics"])

        duration_ms = int((time.time() - start_time) * 1000)
        run.duration_ms = duration_ms
        run.status = "done"
        run.error_message = None
        db.commit()

    except Exception as e:
        db.rollback()
        run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id).first()
        if run:
            run.status = "failed"
            run.error_message = str(e)
            run.duration_ms = int((time.time() - start_time) * 1000)
            db.commit()
    finally:
        db.close()

@router.get("/runs", response_model=List[RunResponse])
def list_runs(
    dataset_id: Optional[str] = None,
    method: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SegmentationRun).filter(SegmentationRun.user_id == current_user.id)
    if dataset_id:
        query = query.filter(SegmentationRun.dataset_id == dataset_id)
    if method:
        query = query.filter(SegmentationRun.method == method.lower())

    runs = query.order_by(SegmentationRun.created_at.desc()).all()
    results = []
    for r in runs:
        results.append(RunResponse(
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
    return results

@router.post("/runs", response_model=RunResponse, status_code=status.HTTP_201_CREATED)
def create_run(
    req: RunCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    method = req.method.lower()
    if method not in ["rfm", "kmeans", "hierarchical", "dbscan"]:
        raise HTTPException(status_code=400, detail=f"Invalid segmentation method '{req.method}'.")

    # Generate default run name if none provided
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    method_display = "RFM" if method == "rfm" else method.title()
    run_name = req.name.strip() if req.name and req.name.strip() else f"{dataset.name} - {method_display} - {timestamp_str}"

    run = SegmentationRun(
        dataset_id=dataset.id,
        user_id=current_user.id,
        name=run_name,
        method=method,
        params_json=json.dumps(req.params or {}),
        features_json=json.dumps(req.features or []),
        status="queued"
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Launch execution in background task
    background_tasks.add_task(execute_segmentation_task, run.id)

    return RunResponse(
        id=run.id,
        dataset_id=run.dataset_id,
        dataset_name=dataset.name,
        user_id=run.user_id,
        name=run.name,
        method=run.method,
        params_json=json.loads(run.params_json),
        features_json=json.loads(run.features_json),
        status=run.status,
        error_message=None,
        n_customers=0,
        n_segments=0,
        metrics_json={},
        duration_ms=0,
        created_at=run.created_at
    )

@router.get("/runs/{run_id}", response_model=RunResponse)
def get_run(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    return RunResponse(
        id=run.id,
        dataset_id=run.dataset_id,
        dataset_name=run.dataset.name if run.dataset else None,
        user_id=run.user_id,
        name=run.name,
        method=run.method,
        params_json=json.loads(run.params_json),
        features_json=json.loads(run.features_json),
        status=run.status,
        error_message=run.error_message,
        n_customers=run.n_customers,
        n_segments=run.n_segments,
        metrics_json=json.loads(run.metrics_json),
        duration_ms=run.duration_ms,
        created_at=run.created_at
    )

@router.patch("/runs/{run_id}", response_model=RunResponse)
def rename_run(
    run_id: str,
    patch: RunPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    if patch.name and patch.name.strip():
        run.name = patch.name.strip()
        db.commit()
        db.refresh(run)

    return RunResponse(
        id=run.id,
        dataset_id=run.dataset_id,
        dataset_name=run.dataset.name if run.dataset else None,
        user_id=run.user_id,
        name=run.name,
        method=run.method,
        params_json=json.loads(run.params_json),
        features_json=json.loads(run.features_json),
        status=run.status,
        error_message=run.error_message,
        n_customers=run.n_customers,
        n_segments=run.n_segments,
        metrics_json=json.loads(run.metrics_json),
        duration_ms=run.duration_ms,
        created_at=run.created_at
    )

@router.delete("/runs/{run_id}")
def delete_run(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    db.delete(run)
    db.commit()
    return {"message": "Run and all associated segment data deleted."}

@router.get("/runs/{run_id}/segments", response_model=List[SegmentResponse])
def get_run_segments(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    segments = db.query(Segment).filter(Segment.run_id == run.id).order_by(Segment.index.asc()).all()
    out = []
    for s in segments:
        out.append(SegmentResponse(
            id=s.id,
            run_id=s.run_id,
            index=s.index,
            name=s.name,
            description=s.description,
            color=s.color,
            size=s.size,
            share_pct=s.share_pct,
            centroid_json=json.loads(s.centroid_json),
            profile_json=json.loads(s.profile_json),
            actions_json=json.loads(s.actions_json)
        ))
    return out

@router.patch("/segments/{segment_id}", response_model=SegmentResponse)
def patch_segment(
    segment_id: str,
    patch: SegmentPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    segment = db.query(Segment).join(SegmentationRun).filter(
        Segment.id == segment_id,
        SegmentationRun.user_id == current_user.id
    ).first()
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found.")

    if patch.name is not None and patch.name.strip():
        segment.name = patch.name.strip()
    if patch.description is not None:
        segment.description = patch.description.strip()

    db.commit()
    db.refresh(segment)

    return SegmentResponse(
        id=segment.id,
        run_id=segment.run_id,
        index=segment.index,
        name=segment.name,
        description=segment.description,
        color=segment.color,
        size=segment.size,
        share_pct=segment.share_pct,
        centroid_json=json.loads(segment.centroid_json),
        profile_json=json.loads(segment.profile_json),
        actions_json=json.loads(segment.actions_json)
    )

@router.get("/runs/{run_id}/map", response_model=MapResponse)
def get_run_map_data(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    segments = db.query(Segment).filter(Segment.run_id == run.id).all()
    seg_map = {s.id: s for s in segments}

    total_customers = db.query(Assignment).filter(Assignment.run_id == run.id).count()

    # Stratified sampling up to 3,000 points
    max_points = 3000
    points: List[MapPoint] = []

    if total_customers <= max_points:
        assignments = db.query(Assignment).filter(Assignment.run_id == run.id).all()
        for a in assignments:
            s = seg_map.get(a.segment_id)
            if s:
                points.append(MapPoint(
                    customer_id=a.customer_id,
                    segment_id=s.id,
                    segment_name=s.name,
                    segment_index=s.index,
                    color=s.color,
                    pca_x=a.pca_x,
                    pca_y=a.pca_y
                ))
    else:
        # Sample proportionally per segment
        for s in segments:
            sample_size = max(10, int((s.size / total_customers) * max_points))
            seg_assignments = db.query(Assignment).filter(
                Assignment.run_id == run.id,
                Assignment.segment_id == s.id
            ).limit(sample_size).all()

            for a in seg_assignments:
                points.append(MapPoint(
                    customer_id=a.customer_id,
                    segment_id=s.id,
                    segment_name=s.name,
                    segment_index=s.index,
                    color=s.color,
                    pca_x=a.pca_x,
                    pca_y=a.pca_y
                ))

    return MapResponse(
        points=points,
        total_customers=total_customers,
        sampled_customers=len(points)
    )

@router.get("/runs/{run_id}/customers", response_model=CustomersPage)
def get_run_customers(
    run_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    segment_id: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_desc: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(SegmentationRun).filter(SegmentationRun.id == run_id, SegmentationRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    segments = db.query(Segment).filter(Segment.run_id == run.id).all()
    seg_map = {s.id: s for s in segments}

    query = db.query(Assignment).filter(Assignment.run_id == run.id)

    if segment_id:
        query = query.filter(Assignment.segment_id == segment_id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Assignment.customer_id.ilike(term))

    if sort_by == "customer_id":
        query = query.order_by(Assignment.customer_id.desc() if sort_desc else Assignment.customer_id.asc())
    elif sort_by == "segment_id":
        query = query.order_by(Assignment.segment_id.desc() if sort_desc else Assignment.segment_id.asc())
    else:
        query = query.order_by(Assignment.id.asc())

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)

    items_db = query.offset((page - 1) * page_size).limit(page_size).all()
    items = []
    for a in items_db:
        seg = seg_map.get(a.segment_id)
        items.append(CustomerItem(
            customer_id=a.customer_id,
            segment_id=a.segment_id,
            segment_name=seg.name if seg else "Unknown",
            segment_index=seg.index if seg else 0,
            color=seg.color if seg else "#8B95B3",
            features=json.loads(a.features_json),
            pca_x=a.pca_x,
            pca_y=a.pca_y
        ))

    return CustomersPage(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=items
    )
