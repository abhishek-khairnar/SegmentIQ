from typing import Dict, Any, List, Tuple
from datetime import datetime
import pandas as pd
import numpy as np

RFM_SEGMENT_DEFINITIONS = {
    "Champions": {
        "description": "Bought recently, often, and spend well.",
        "actions": [
            "Reward with early access",
            "Ask for reviews and referrals",
            "Do not discount"
        ]
    },
    "Can't Lose Them": {
        "description": "Top spenders who have gone quiet.",
        "actions": [
            "Reach out personally",
            "Offer a strong win-back deal",
            "Ask for feedback urgently"
        ]
    },
    "At Risk": {
        "description": "Used to buy often but not lately.",
        "actions": [
            "Send personalised win-back messages",
            "Offer renewals or bundles",
            "Ask why they left"
        ]
    },
    "Need Attention": {
        "description": "Average on all measures and slipping.",
        "actions": [
            "Limited-time offers",
            "Personalised recommendations",
            "Re-engage with reminders"
        ]
    },
    "Loyal Customers": {
        "description": "Buy regularly and respond to offers.",
        "actions": [
            "Upsell higher-value items",
            "Offer a loyalty programme",
            "Ask for feedback"
        ]
    },
    "New Customers": {
        "description": "First purchase very recently.",
        "actions": [
            "Send a welcome series",
            "Make onboarding easy",
            "Invite a second purchase"
        ]
    },
    "Promising": {
        "description": "Recent but low frequency.",
        "actions": [
            "Build brand awareness",
            "Offer a small starter incentive",
            "Share best sellers"
        ]
    },
    "Potential Loyalists": {
        "description": "Recent customers with a few purchases.",
        "actions": [
            "Recommend related products",
            "Offer a membership",
            "Send a thank-you with a second-purchase incentive"
        ]
    },
    "About to Sleep": {
        "description": "Below-average recency and frequency.",
        "actions": [
            "Share useful content",
            "Offer a time-limited discount",
            "Recommend popular items"
        ]
    },
    "Hibernating": {
        "description": "Low activity and long inactive.",
        "actions": [
            "Offer relevant products at low prices",
            "Run a reactivation campaign",
            "Remove from costly channels if no response"
        ]
    },
    "Lost": {
        "description": "Lowest recency and frequency.",
        "actions": [
            "Run one low-cost revival attempt",
            "Use for lookalike audiences",
            "Then suppress"
        ]
    }
}

SEGMENT_COLORS = [
    "#4F8DF7", "#F5A524", "#2DD4BF", "#F0568C", "#A78BFA",
    "#84CC16", "#F97316", "#38BDF8", "#E879F9", "#94A3B8",
    "#64748B", "#EC4899", "#14B8A6"
]

def map_rf_to_segment(r: int, f: int) -> str:
    """
    Evaluates RF score against the exact 11 rules in order (first match wins).
    Covers all 25 pairs of (R in 1..5, F in 1..5).
    """
    if r >= 4 and f >= 4:
        return "Champions"
    if r == 1 and f >= 4:
        return "Can't Lose Them"
    if r <= 2 and f >= 3:
        return "At Risk"
    if r == 3 and f == 3:
        return "Need Attention"
    if r >= 3 and f >= 3:
        return "Loyal Customers"
    if r >= 4 and f == 1:
        return "New Customers"
    if r == 3 and f == 1:
        return "Promising"
    if r >= 3 and f == 2:
        return "Potential Loyalists"
    if r == 2 and f <= 2:
        return "About to Sleep"
    if r == 1 and f == 2:
        return "Hibernating"
    if r == 1 and f == 1:
        return "Lost"
    # Fallback safety
    return "Promising"

def build_rfm_customer_table(df_transactions: pd.DataFrame, mapping: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    cid_col = mapping["customer_id"]
    date_col = mapping["date"]
    amt_col = mapping["amount"]
    order_col = mapping.get("order_id")
    cat_col = mapping.get("category")

    # Ensure date parsed
    df_transactions[date_col] = pd.to_datetime(df_transactions[date_col])
    ref_date = df_transactions[date_col].max() + pd.Timedelta(days=1)

    grouped = df_transactions.groupby(cid_col)

    records = []
    for cid, group in grouped:
        last_date = group[date_col].max()
        first_date = group[date_col].min()
        recency_days = max(1, (ref_date - last_date).days)
        tenure_days = max(1, (ref_date - first_date).days)

        if order_col and order_col in group.columns:
            freq = group[order_col].nunique()
        else:
            freq = len(group)

        freq = max(1, freq)
        monetary = float(group[amt_col].sum())
        monetary = round(max(0.01, monetary), 2)
        avg_order_value = round(monetary / freq, 2)

        row = {
            "customer_id": str(cid),
            "recency_days": int(recency_days),
            "frequency": int(freq),
            "monetary": float(monetary),
            "avg_order_value": float(avg_order_value),
            "tenure_days": int(tenure_days)
        }

        if cat_col and cat_col in group.columns:
            cat_variety = group[cat_col].nunique()
            row["category_variety"] = int(cat_variety)

        records.append(row)

    df_rfm = pd.DataFrame(records)
    meta = {
        "reference_date": ref_date.isoformat(),
        "total_customers": len(df_rfm)
    }
    return df_rfm, meta

def compute_rfm_scores(df_rfm: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    df = df_rfm.copy()
    n_cust = len(df)
    meta = {}

    # Recency: lower is better -> invert rank so highest rank is lowest recency days
    # Using method="first" rank ensures strictly monotonic values for qcut
    df["r_rank"] = df["recency_days"].rank(method="first", ascending=False)
    df["f_rank"] = df["frequency"].rank(method="first", ascending=True)
    df["m_rank"] = df["monetary"].rank(method="first", ascending=True)

    num_bins = min(5, n_cust)
    meta["quantiles_used"] = num_bins

    if num_bins >= 2:
        df["r_score"] = pd.qcut(df["r_rank"], q=num_bins, labels=range(1, num_bins + 1)).astype(int)
        df["f_score"] = pd.qcut(df["f_rank"], q=num_bins, labels=range(1, num_bins + 1)).astype(int)
        df["m_score"] = pd.qcut(df["m_rank"], q=num_bins, labels=range(1, num_bins + 1)).astype(int)
    else:
        df["r_score"] = 5
        df["f_score"] = 5
        df["m_score"] = 5

    # Scale scores to 1..5 if fewer than 5 bins were possible
    if num_bins < 5 and num_bins > 1:
        df["r_score"] = ((df["r_score"] - 1) / (num_bins - 1) * 4 + 1).round().astype(int)
        df["f_score"] = ((df["f_score"] - 1) / (num_bins - 1) * 4 + 1).round().astype(int)
        df["m_score"] = ((df["m_score"] - 1) / (num_bins - 1) * 4 + 1).round().astype(int)

    df["rfm_segment"] = [map_rf_to_segment(r, f) for r, f in zip(df["r_score"], df["f_score"])]
    df["rfm_score_str"] = df["r_score"].astype(str) + df["f_score"].astype(str) + df["m_score"].astype(str)

    # Drop rank working columns
    df = df.drop(columns=["r_rank", "f_rank", "m_rank"])
    return df, meta
