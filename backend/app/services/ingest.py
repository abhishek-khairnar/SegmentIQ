import os
import io
import csv
import json
import uuid
from typing import Dict, Any, Tuple, List
from pathlib import Path
import pandas as pd
import numpy as np
import charset_normalizer
from fastapi import HTTPException
from app.config import settings

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
MAX_ROWS = 200_000
MAX_COLS = 100

def detect_encoding_and_delimiter(file_bytes: bytes) -> Tuple[str, str]:
    sample = file_bytes[:65536]
    detected = charset_normalizer.from_bytes(sample).best()
    encoding = detected.encoding if detected and detected.encoding else "utf-8"

    try:
        sample_str = sample.decode(encoding, errors="replace")
    except Exception:
        encoding = "utf-8"
        sample_str = sample.decode("utf-8", errors="replace")

    # Delimiter detection
    try:
        dialect = csv.Sniffer().sniff(sample_str[:4096], delimiters=[',', ';', '\t', '|'])
        delimiter = dialect.delimiter
    except Exception:
        # Fallback check
        first_line = sample_str.split("\n")[0] if "\n" in sample_str else sample_str
        candidates = [',', ';', '\t', '|']
        counts = {c: first_line.count(c) for c in candidates}
        delimiter = max(counts, key=counts.get)
        if counts[delimiter] == 0:
            delimiter = ','

    return encoding, delimiter

def infer_column_type(series: pd.Series, col_name: str) -> str:
    lower_col = col_name.lower()
    if any(term in lower_col for term in ["id", "uuid", "code", "key"]) and not pd.api.types.is_float_dtype(series):
        return "id"

    # Datetime check
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    
    # Try parsing sample strings to datetime if object
    if pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series):
        non_null = series.dropna().astype(str).head(50)
        if len(non_null) > 0 and any(term in lower_col for term in ["date", "time", "timestamp", "day"]):
            try:
                parsed = pd.to_datetime(non_null, errors="coerce")
                if parsed.notna().mean() > 0.8:
                    return "datetime"
            except Exception:
                pass

    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    return "categorical"

def guess_column_mappings(df: pd.DataFrame, source_type: str, schema: Dict[str, str]) -> Dict[str, Any]:
    mapping: Dict[str, Any] = {}
    cols_lower = {col.lower(): col for col in df.columns}

    if source_type == "transactions":
        # Guess customer_id
        for candidate in ["customer_id", "customerid", "client_id", "user_id", "userid", "customer", "account_id"]:
            if candidate in cols_lower:
                mapping["customer_id"] = cols_lower[candidate]
                break
        if "customer_id" not in mapping:
            # Look for any ID column
            for col, itype in schema.items():
                if itype == "id" and "order" not in col.lower() and "invoice" not in col.lower():
                    mapping["customer_id"] = col
                    break

        # Guess date
        for candidate in ["date", "order_date", "invoicedate", "transaction_date", "created_at", "purchase_date"]:
            if candidate in cols_lower:
                mapping["date"] = cols_lower[candidate]
                break
        if "date" not in mapping:
            for col, itype in schema.items():
                if itype == "datetime":
                    mapping["date"] = col
                    break

        # Guess amount
        for candidate in ["amount", "total", "sales", "price", "unitprice", "revenue", "order_total", "spend"]:
            if candidate in cols_lower:
                mapping["amount"] = cols_lower[candidate]
                break
        if "amount" not in mapping:
            for col, itype in schema.items():
                if itype == "numeric" and col not in mapping.values():
                    mapping["amount"] = col
                    break

        # Guess optional order_id
        for candidate in ["order_id", "orderid", "invoice_no", "invoiceno", "transaction_id", "receipt_id"]:
            if candidate in cols_lower:
                mapping["order_id"] = cols_lower[candidate]
                break

        # Guess optional category
        for candidate in ["category", "product_category", "department", "item_group", "segment"]:
            if candidate in cols_lower:
                mapping["category"] = cols_lower[candidate]
                break

    else:  # "features"
        # Guess customer_id
        for candidate in ["customer_id", "customerid", "client_id", "user_id", "userid", "id"]:
            if candidate in cols_lower:
                mapping["customer_id"] = cols_lower[candidate]
                break
        if "customer_id" not in mapping:
            first_col = df.columns[0]
            mapping["customer_id"] = first_col

        # Allowed numeric feature columns
        numeric_cols = [
            col for col, itype in schema.items()
            if itype == "numeric" and col != mapping.get("customer_id")
        ]
        mapping["feature_columns"] = numeric_cols

    return mapping

def ingest_csv_data(
    file_bytes: bytes,
    original_filename: str,
    source_type: str,
    user_id: str
) -> Tuple[str, Dict[str, Any], Dict[str, Any], Dict[str, Any], int, int]:
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds maximum size limit of 20 MB.")

    if not original_filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    encoding, delimiter = detect_encoding_and_delimiter(file_bytes)

    try:
        df = pd.read_csv(
            io.BytesIO(file_bytes),
            encoding=encoding,
            sep=delimiter,
            low_memory=False
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    if len(df.columns) > MAX_COLS:
        raise HTTPException(status_code=400, detail=f"Dataset has {len(df.columns)} columns, exceeding maximum limit of {MAX_COLS}.")

    if len(df) > MAX_ROWS:
        raise HTTPException(status_code=400, detail=f"Dataset has {len(df)} rows, exceeding maximum limit of {MAX_ROWS}.")

    # Clean column names (strip whitespace, ensure unique names)
    cleaned_columns = []
    seen = {}
    for c in df.columns:
        col_str = str(c).strip()
        if not col_str:
            col_str = "Unnamed"
        if col_str in seen:
            seen[col_str] += 1
            col_str = f"{col_str}_{seen[col_str]}"
        else:
            seen[col_str] = 0
        cleaned_columns.append(col_str)
    df.columns = cleaned_columns

    raw_row_count = len(df)
    quality_audit: Dict[str, Any] = {
        "raw_rows": raw_row_count,
        "raw_columns": len(df.columns),
        "encoding_detected": encoding,
        "delimiter_detected": delimiter,
        "actions_taken": []
    }

    schema_json: Dict[str, str] = {}
    for col in df.columns:
        schema_json[col] = infer_column_type(df[col], col)

    initial_mapping = guess_column_mappings(df, source_type, schema_json)

    # Perform cleaning based on source type
    if source_type == "transactions":
        # Check required columns from guess or search
        cid_col = initial_mapping.get("customer_id")
        date_col = initial_mapping.get("date")
        amt_col = initial_mapping.get("amount")

        # Fallback check if not found
        if not cid_col or cid_col not in df.columns:
            cid_col = df.columns[0]
            initial_mapping["customer_id"] = cid_col
        if not amt_col or amt_col not in df.columns:
            # find first numeric
            for c in df.columns:
                if pd.api.types.is_numeric_dtype(df[c]) and c != cid_col:
                    amt_col = c
                    initial_mapping["amount"] = c
                    break

        # Check duplicate rows
        dup_count = int(df.duplicated().sum())
        if dup_count > 0:
            df = df.drop_duplicates()
            quality_audit["actions_taken"].append(f"Dropped {dup_count} exact duplicate rows.")
        quality_audit["duplicate_rows_removed"] = dup_count

        # Missing values check on key columns
        missing_cid = int(df[cid_col].isna().sum()) if cid_col in df.columns else 0
        if missing_cid > 0:
            df = df.dropna(subset=[cid_col])
            quality_audit["actions_taken"].append(f"Dropped {missing_cid} rows with missing customer ID.")
        quality_audit["missing_customer_id_removed"] = missing_cid

        # Date parsing & cleaning
        if date_col and date_col in df.columns:
            parsed_dates = pd.to_datetime(df[date_col], errors="coerce")
            invalid_dates = int(parsed_dates.isna().sum())
            if len(df) > 0 and (invalid_dates / len(df)) > 0.20:
                raise HTTPException(
                    status_code=400,
                    detail=f"Over 20% ({invalid_dates}/{len(df)}) of rows in date column '{date_col}' could not be parsed as valid dates."
                )
            if invalid_dates > 0:
                df = df[parsed_dates.notna()].copy()
                df[date_col] = parsed_dates[parsed_dates.notna()]
                quality_audit["actions_taken"].append(f"Dropped {invalid_dates} rows with unparseable dates in '{date_col}'.")
            else:
                df[date_col] = parsed_dates
            quality_audit["invalid_dates_removed"] = invalid_dates

        # Amount cleaning (drop <= 0 returns/voids)
        if amt_col and amt_col in df.columns:
            # Force numeric conversion
            numeric_amt = pd.to_numeric(df[amt_col], errors="coerce")
            invalid_amt_count = int(numeric_amt.isna().sum())
            df[amt_col] = numeric_amt
            if invalid_amt_count > 0:
                df = df.dropna(subset=[amt_col])
                quality_audit["actions_taken"].append(f"Dropped {invalid_amt_count} rows with non-numeric amounts.")

            non_positive_count = int((df[amt_col] <= 0).sum())
            if non_positive_count > 0:
                df = df[df[amt_col] > 0]
                quality_audit["actions_taken"].append(f"Excluded {non_positive_count} rows with zero or negative amounts (returns/voids).")
            quality_audit["returns_or_negative_amounts_excluded"] = non_positive_count

    else:  # "features"
        cid_col = initial_mapping.get("customer_id")
        if not cid_col or cid_col not in df.columns:
            cid_col = df.columns[0]
            initial_mapping["customer_id"] = cid_col

        # Handle duplicate customer IDs: keep first
        dup_customers = int(df.duplicated(subset=[cid_col]).sum())
        if dup_customers > 0:
            df = df.drop_duplicates(subset=[cid_col], keep="first")
            quality_audit["actions_taken"].append(f"Retained first occurrence for {dup_customers} duplicate customer IDs.")
        quality_audit["duplicate_customers_removed"] = dup_customers

        # Numeric columns with > 40% missing values are excluded
        excluded_cols = []
        imputed_cols = []
        for col in df.columns:
            if col == cid_col:
                continue
            if pd.api.types.is_numeric_dtype(df[col]):
                missing_ratio = df[col].isna().mean()
                if missing_ratio > 0.40:
                    excluded_cols.append(col)
                    df = df.drop(columns=[col])
                    quality_audit["actions_taken"].append(f"Excluded feature '{col}' due to >40% ({missing_ratio:.1%}) missing values.")
                elif missing_ratio > 0:
                    median_val = float(df[col].median())
                    df[col] = df[col].fillna(median_val)
                    imputed_cols.append(col)
                    quality_audit["actions_taken"].append(f"Imputed missing values in '{col}' with median ({median_val:.2f}).")
        
        quality_audit["excluded_sparse_columns"] = excluded_cols
        quality_audit["imputed_columns"] = imputed_cols

        # Refresh schema and mapping feature columns
        schema_json = {col: infer_column_type(df[col], col) for col in df.columns}
        initial_mapping["feature_columns"] = [
            c for c, t in schema_json.items()
            if t == "numeric" and c != cid_col
        ]

    final_row_count = len(df)
    quality_audit["final_rows"] = final_row_count
    quality_audit["final_columns"] = len(df.columns)

    if final_row_count == 0:
        raise HTTPException(status_code=400, detail="No rows remaining after data quality cleaning.")

    # Save to Parquet in backend storage directory
    file_id = f"{user_id}_{uuid.uuid4().hex}"
    parquet_filename = f"{file_id}.parquet"
    parquet_path = settings.storage_path / parquet_filename

    # Convert object columns that might contain mixed types to string for Parquet
    for col in df.columns:
        if df[col].dtype == object or pd.api.types.is_string_dtype(df[col]):
            df[col] = df[col].astype(str)

    df.to_parquet(parquet_path, index=False)

    return str(parquet_path), schema_json, initial_mapping, quality_audit, final_row_count, len(df.columns)
