from typing import Dict, Any, List
import pandas as pd
import numpy as np
from app.services.ingest import infer_column_type

def profile_dataset(parquet_path: str) -> Dict[str, Any]:
    df = pd.read_parquet(parquet_path)
    total_rows = len(df)
    total_cols = len(df.columns)
    
    profiles: List[Dict[str, Any]] = []

    for col in df.columns:
        series = df[col]
        inferred = infer_column_type(series, col)
        missing_count = int(series.isna().sum())
        missing_pct = round(float(missing_count / total_rows * 100), 2) if total_rows > 0 else 0.0
        unique_count = int(series.nunique(dropna=True))

        col_prof: Dict[str, Any] = {
            "name": col,
            "dtype": str(series.dtype),
            "inferred_type": inferred,
            "missing_count": missing_count,
            "missing_pct": missing_pct,
            "unique_count": unique_count,
            "min": None,
            "max": None,
            "mean": None,
            "median": None,
            "std": None,
            "histogram": None,
        }

        # If numeric or inferable as numeric
        is_num = pd.api.types.is_numeric_dtype(series)
        if not is_num and inferred == "numeric":
            series_num = pd.to_numeric(series, errors="coerce")
            if series_num.notna().sum() > 0:
                series = series_num
                is_num = True

        if is_num:
            valid_vals = series.dropna()
            if len(valid_vals) > 0:
                col_prof["min"] = round(float(valid_vals.min()), 2)
                col_prof["max"] = round(float(valid_vals.max()), 2)
                col_prof["mean"] = round(float(valid_vals.mean()), 2)
                col_prof["median"] = round(float(valid_vals.median()), 2)
                col_prof["std"] = round(float(valid_vals.std()), 2) if len(valid_vals) > 1 else 0.0

                # Compute 10-bin histogram
                try:
                    counts, bin_edges = np.histogram(valid_vals, bins=10)
                    hist = []
                    for i in range(len(counts)):
                        hist.append({
                            "bin": f"{bin_edges[i]:.1f} - {bin_edges[i+1]:.1f}",
                            "low": round(float(bin_edges[i]), 2),
                            "high": round(float(bin_edges[i+1]), 2),
                            "count": int(counts[i])
                        })
                    col_prof["histogram"] = hist
                except Exception:
                    col_prof["histogram"] = []

        profiles.append(col_prof)

    return {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "columns": profiles
    }
