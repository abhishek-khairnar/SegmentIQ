import pytest
import pandas as pd
from datetime import datetime, timedelta
from app.services.rfm import map_rf_to_segment, build_rfm_customer_table, compute_rfm_scores, RFM_SEGMENT_DEFINITIONS

def test_all_25_rf_combinations_map_to_valid_segments():
    """
    Requirement: All 25 combinations of R (1..5) and F (1..5) must map
    to exactly one of the 11 defined segments with zero missing or ambiguous pairs.
    """
    valid_segment_names = set(RFM_SEGMENT_DEFINITIONS.keys())
    assert len(valid_segment_names) == 11

    mapped_segments = set()
    combination_count = 0

    for r in range(1, 6):
        for f in range(1, 6):
            combination_count += 1
            segment = map_rf_to_segment(r, f)
            assert segment in valid_segment_names, f"Pair ({r}, {f}) mapped to invalid segment '{segment}'"
            mapped_segments.add(segment)

    assert combination_count == 25
    # Verify key archetypes
    assert map_rf_to_segment(5, 5) == "Champions"
    assert map_rf_to_segment(1, 5) == "Can't Lose Them"
    assert map_rf_to_segment(2, 4) == "At Risk"
    assert map_rf_to_segment(3, 3) == "Need Attention"
    assert map_rf_to_segment(4, 3) == "Loyal Customers"
    assert map_rf_to_segment(5, 1) == "New Customers"
    assert map_rf_to_segment(3, 1) == "Promising"
    assert map_rf_to_segment(4, 2) == "Potential Loyalists"
    assert map_rf_to_segment(2, 2) == "About to Sleep"
    assert map_rf_to_segment(1, 2) == "Hibernating"
    assert map_rf_to_segment(1, 1) == "Lost"

def test_rfm_customer_aggregation_and_scoring():
    base_date = datetime(2026, 1, 1)
    data = [
        {"order_id": "O1", "customer_id": "C1", "order_date": base_date + timedelta(days=10), "amount": 100.0, "category": "A"},
        {"order_id": "O2", "customer_id": "C1", "order_date": base_date + timedelta(days=20), "amount": 150.0, "category": "B"},
        {"order_id": "O3", "customer_id": "C2", "order_date": base_date + timedelta(days=5), "amount": 50.0, "category": "A"},
        {"order_id": "O4", "customer_id": "C3", "order_date": base_date + timedelta(days=25), "amount": 400.0, "category": "C"},
        {"order_id": "O5", "customer_id": "C4", "order_date": base_date + timedelta(days=1), "amount": 20.0, "category": "A"},
        {"order_id": "O6", "customer_id": "C5", "order_date": base_date + timedelta(days=2), "amount": 30.0, "category": "B"},
    ]
    df = pd.DataFrame(data)
    mapping = {
        "customer_id": "customer_id",
        "date": "order_date",
        "amount": "amount",
        "order_id": "order_id",
        "category": "category"
    }

    df_rfm, meta = build_rfm_customer_table(df, mapping)
    assert len(df_rfm) == 5
    assert "recency_days" in df_rfm.columns
    assert "frequency" in df_rfm.columns
    assert "monetary" in df_rfm.columns
    assert "avg_order_value" in df_rfm.columns
    assert "category_variety" in df_rfm.columns

    df_scored, score_meta = compute_rfm_scores(df_rfm)
    assert "r_score" in df_scored.columns
    assert "f_score" in df_scored.columns
    assert "m_score" in df_scored.columns
    assert "rfm_segment" in df_scored.columns
    assert df_scored["rfm_segment"].nunique() >= 1
