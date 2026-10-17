import json
import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import pandas as pd
from app.db import get_db
from app.models import User, Dataset, SegmentationRun
from app.schemas import DatasetResponse, DatasetPatch, DatasetPreview, DatasetProfileResponse
from app.deps import get_current_user
from app.services.ingest import ingest_csv_data
from app.services.profiling import profile_dataset
from app.services.samples import load_sample_dataset

router = APIRouter(prefix="/datasets", tags=["datasets"])

@router.get("", response_model=List[DatasetResponse])
def list_datasets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    datasets = db.query(Dataset).filter(Dataset.user_id == current_user.id).order_by(Dataset.created_at.desc()).all()
    out = []
    for d in datasets:
        runs_count = db.query(SegmentationRun).filter(SegmentationRun.dataset_id == d.id).count()
        out.append(DatasetResponse(
            id=d.id,
            user_id=d.user_id,
            name=d.name,
            source_type=d.source_type,
            original_filename=d.original_filename,
            row_count=d.row_count,
            column_count=d.column_count,
            schema_json=json.loads(d.schema_json),
            mapping_json=json.loads(d.mapping_json),
            quality_json=json.loads(d.quality_json),
            created_at=d.created_at,
            runs_count=runs_count
        ))
    return out

@router.post("", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    source_type: str = Form("transactions"),
    name: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if source_type not in ["transactions", "features"]:
        raise HTTPException(status_code=400, detail="source_type must be 'transactions' or 'features'")

    content = await file.read()
    filename = file.filename or "dataset.csv"
    dataset_name = name.strip() if name and name.strip() else Path(filename).stem.replace("_", " ").title()

    file_path, schema_dict, mapping_dict, quality_dict, rows, cols = ingest_csv_data(
        file_bytes=content,
        original_filename=filename,
        source_type=source_type,
        user_id=current_user.id
    )

    dataset = Dataset(
        user_id=current_user.id,
        name=dataset_name,
        source_type=source_type,
        original_filename=filename,
        file_path=file_path,
        row_count=rows,
        column_count=cols,
        schema_json=json.dumps(schema_dict),
        mapping_json=json.dumps(mapping_dict),
        quality_json=json.dumps(quality_dict)
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return DatasetResponse(
        id=dataset.id,
        user_id=dataset.user_id,
        name=dataset.name,
        source_type=dataset.source_type,
        original_filename=dataset.original_filename,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        schema_json=schema_dict,
        mapping_json=mapping_dict,
        quality_json=quality_dict,
        created_at=dataset.created_at,
        runs_count=0
    )

@router.post("/sample/{sample_key}", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
def create_from_sample(
    sample_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    name, source_type, file_path, schema_dict, mapping_dict, quality_dict, rows, cols = load_sample_dataset(
        sample_key=sample_key,
        user_id=current_user.id
    )

    dataset = Dataset(
        user_id=current_user.id,
        name=name,
        source_type=source_type,
        original_filename=f"{sample_key}.csv",
        file_path=file_path,
        row_count=rows,
        column_count=cols,
        schema_json=json.dumps(schema_dict),
        mapping_json=json.dumps(mapping_dict),
        quality_json=json.dumps(quality_dict)
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return DatasetResponse(
        id=dataset.id,
        user_id=dataset.user_id,
        name=dataset.name,
        source_type=dataset.source_type,
        original_filename=dataset.original_filename,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        schema_json=schema_dict,
        mapping_json=mapping_dict,
        quality_json=quality_dict,
        created_at=dataset.created_at,
        runs_count=0
    )

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    runs_count = db.query(SegmentationRun).filter(SegmentationRun.dataset_id == dataset.id).count()
    return DatasetResponse(
        id=dataset.id,
        user_id=dataset.user_id,
        name=dataset.name,
        source_type=dataset.source_type,
        original_filename=dataset.original_filename,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        schema_json=json.loads(dataset.schema_json),
        mapping_json=json.loads(dataset.mapping_json),
        quality_json=json.loads(dataset.quality_json),
        created_at=dataset.created_at,
        runs_count=runs_count
    )

@router.patch("/{dataset_id}", response_model=DatasetResponse)
def update_dataset(
    dataset_id: str,
    patch: DatasetPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if patch.name is not None and patch.name.strip():
        dataset.name = patch.name.strip()
    if patch.mapping_json is not None:
        dataset.mapping_json = json.dumps(patch.mapping_json)

    db.commit()
    db.refresh(dataset)

    runs_count = db.query(SegmentationRun).filter(SegmentationRun.dataset_id == dataset.id).count()
    return DatasetResponse(
        id=dataset.id,
        user_id=dataset.user_id,
        name=dataset.name,
        source_type=dataset.source_type,
        original_filename=dataset.original_filename,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        schema_json=json.loads(dataset.schema_json),
        mapping_json=json.loads(dataset.mapping_json),
        quality_json=json.loads(dataset.quality_json),
        created_at=dataset.created_at,
        runs_count=runs_count
    )

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    # Remove parquet file from storage if present
    try:
        p_path = Path(dataset.file_path)
        if p_path.exists():
            p_path.unlink()
    except Exception:
        pass

    db.delete(dataset)
    db.commit()
    return {"message": "Dataset and all associated runs successfully deleted."}

@router.get("/{dataset_id}/preview", response_model=DatasetPreview)
def get_dataset_preview(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if not Path(dataset.file_path).exists():
        raise HTTPException(status_code=404, detail="Underlying dataset file not found.")

    df = pd.read_parquet(dataset.file_path)
    preview_df = df.head(50)

    # Format values for clean JSON rendering
    rows = []
    for _, r in preview_df.iterrows():
        row_dict = {}
        for col in df.columns:
            val = r[col]
            if pd.isna(val):
                row_dict[col] = None
            elif isinstance(val, (np.floating, float)):
                row_dict[col] = round(float(val), 2)
            else:
                row_dict[col] = str(val)
        rows.append(row_dict)

    return DatasetPreview(
        columns=list(df.columns),
        rows=rows,
        total_rows=len(df)
    )

@router.get("/{dataset_id}/profile", response_model=DatasetProfileResponse)
def get_dataset_profile(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if not Path(dataset.file_path).exists():
        raise HTTPException(status_code=404, detail="Underlying dataset file not found.")

    prof = profile_dataset(dataset.file_path)
    return DatasetProfileResponse(
        dataset_id=dataset.id,
        total_rows=prof["total_rows"],
        total_columns=prof["total_columns"],
        columns=prof["columns"]
    )
