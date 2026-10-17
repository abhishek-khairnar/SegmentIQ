import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from app.db import get_db
from app.models import User, Dataset
from app.schemas import SuggestKRequest, SuggestKResponse, SuggestEpsRequest, SuggestEpsResponse
from app.deps import get_current_user
from app.services.clustering import suggest_k, suggest_eps

router = APIRouter(prefix="/datasets", tags=["suggestions"])

@router.post("/{dataset_id}/suggest-k", response_model=SuggestKResponse)
def get_suggested_k(
    dataset_id: str,
    req: SuggestKRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if not Path(dataset.file_path).exists():
        raise HTTPException(status_code=404, detail="Dataset parquet file not found.")

    df = pd.read_parquet(dataset.file_path)

    # If transactions, build RFM features first if needed
    if dataset.source_type == "transactions":
        from app.services.rfm import build_rfm_customer_table
        mapping = json.loads(dataset.mapping_json)
        df_rfm, _ = build_rfm_customer_table(df, mapping)
        feature_cols = [c for c in req.features if c in df_rfm.columns]
        if not feature_cols:
            feature_cols = ["recency_days", "frequency", "monetary"]
        df_to_use = df_rfm
    else:
        feature_cols = [c for c in req.features if c in df.columns]
        if not feature_cols:
            raise HTTPException(status_code=400, detail="No valid feature columns provided for suggestion.")
        df_to_use = df

    res = suggest_k(
        df=df_to_use,
        feature_cols=feature_cols,
        apply_log=req.log_transform,
        apply_cap=req.cap_outliers
    )
    return SuggestKResponse(**res)

@router.post("/{dataset_id}/suggest-eps", response_model=SuggestEpsResponse)
def get_suggested_eps(
    dataset_id: str,
    req: SuggestEpsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if not Path(dataset.file_path).exists():
        raise HTTPException(status_code=404, detail="Dataset parquet file not found.")

    df = pd.read_parquet(dataset.file_path)

    if dataset.source_type == "transactions":
        from app.services.rfm import build_rfm_customer_table
        mapping = json.loads(dataset.mapping_json)
        df_rfm, _ = build_rfm_customer_table(df, mapping)
        feature_cols = [c for c in req.features if c in df_rfm.columns]
        if not feature_cols:
            feature_cols = ["recency_days", "frequency", "monetary"]
        df_to_use = df_rfm
    else:
        feature_cols = [c for c in req.features if c in df.columns]
        if not feature_cols:
            raise HTTPException(status_code=400, detail="No valid feature columns provided for suggestion.")
        df_to_use = df

    res = suggest_eps(
        df=df_to_use,
        feature_cols=feature_cols,
        min_samples=req.min_samples,
        apply_log=req.log_transform,
        apply_cap=req.cap_outliers
    )
    return SuggestEpsResponse(**res)
