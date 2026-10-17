from pathlib import Path
from typing import Tuple, Dict, Any
from fastapi import HTTPException
from app.services.ingest import ingest_csv_data

SAMPLE_KEYS = {
    "online_store_transactions": {
        "filename": "online_store_transactions.csv",
        "name": "Online Store Transactions",
        "source_type": "transactions"
    },
    "mall_customers": {
        "filename": "mall_customers.csv",
        "name": "Mall Customers",
        "source_type": "features"
    }
}

def load_sample_dataset(sample_key: str, user_id: str) -> Tuple[str, str, str, Dict[str, Any], Dict[str, Any], Dict[str, Any], int, int]:
    if sample_key not in SAMPLE_KEYS:
        raise HTTPException(status_code=404, detail=f"Sample dataset '{sample_key}' not found. Available samples: {list(SAMPLE_KEYS.keys())}")

    meta = SAMPLE_KEYS[sample_key]
    base_dir = Path(__file__).resolve().parent.parent.parent
    file_path = base_dir / "sample_data" / meta["filename"]

    if not file_path.exists():
        raise HTTPException(status_code=500, detail="Sample dataset file missing on server.")

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    parquet_path, schema_json, mapping_json, quality_audit, rows, cols = ingest_csv_data(
        file_bytes=file_bytes,
        original_filename=meta["filename"],
        source_type=meta["source_type"],
        user_id=user_id
    )

    return meta["name"], meta["source_type"], parquet_path, schema_json, mapping_json, quality_audit, rows, cols
