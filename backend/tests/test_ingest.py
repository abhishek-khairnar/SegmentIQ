import pytest
import os
from pathlib import Path
from app.services.ingest import detect_encoding_and_delimiter, ingest_csv_data

def test_detect_delimiter_and_encoding():
    csv_comma = b"id,name,amount\n1,Alpha,50\n2,Beta,100"
    enc, delim = detect_encoding_and_delimiter(csv_comma)
    assert delim == ","

    csv_semi = b"id;name;amount\n1;Alpha;50\n2;Beta;100"
    _, delim_semi = detect_encoding_and_delimiter(csv_semi)
    assert delim_semi == ";"

    csv_tab = b"id\tname\tamount\n1\tAlpha\t50\n2\tBeta\t100"
    _, delim_tab = detect_encoding_and_delimiter(csv_tab)
    assert delim_tab == "\t"

def test_ingest_transactions_cleaning():
    # Includes returns (amount <= 0), duplicate row, missing customer_id
    raw_csv = (
        "customer_id,order_date,amount,category\n"
        "C1,2026-01-01,100.0,Electronics\n"
        "C1,2026-01-01,100.0,Electronics\n"  # duplicate
        "C2,2026-01-02,-50.0,Electronics\n"  # negative amount (return)
        ",2026-01-03,80.0,Apparel\n"         # missing customer
        "C3,2026-01-04,120.0,Apparel\n"
    ).encode("utf-8")

    parquet_path, schema, mapping, quality, rows, cols = ingest_csv_data(
        file_bytes=raw_csv,
        original_filename="test_transactions.csv",
        source_type="transactions",
        user_id="test_user_ingest"
    )

    assert Path(parquet_path).exists()
    assert rows == 2  # C1 (deduped) and C3
    assert quality["duplicate_rows_removed"] == 1
    assert quality["returns_or_negative_amounts_excluded"] == 1
    assert quality["missing_customer_id_removed"] == 1
    assert mapping["customer_id"] == "customer_id"
    assert mapping["date"] == "order_date"
    assert mapping["amount"] == "amount"

    # Cleanup temporary test file
    Path(parquet_path).unlink(missing_ok=True)
