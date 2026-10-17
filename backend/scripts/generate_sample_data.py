import os
import random
from pathlib import Path
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

def generate_datasets():
    np.random.seed(42)
    random.seed(42)

    base_dir = Path(__file__).resolve().parent.parent
    sample_dir = base_dir / "sample_data"
    sample_dir.mkdir(parents=True, exist_ok=True)

    frontend_samples_dir = base_dir.parent / "frontend" / "public" / "samples"
    frontend_samples_dir.mkdir(parents=True, exist_ok=True)

    # ----------------------------------------------------
    # 1. Online Store Transactions
    # ----------------------------------------------------
    print("Generating online_store_transactions.csv...")
    n_customers = 2500
    customer_ids = [f"CUST-{1000 + i}" for i in range(n_customers)]

    # Assign each customer to one of 4 behavioral personas
    # 0: Loyal High Spenders (15%), 1: Occasional Buyers (40%), 2: New Customers (25%), 3: Lapsed Customers (20%)
    persona_probs = [0.15, 0.40, 0.25, 0.20]
    personas = np.random.choice([0, 1, 2, 3], size=n_customers, p=persona_probs)

    categories = ["Electronics", "Apparel", "Home & Kitchen", "Books & Media", "Health & Beauty", "Sports & Outdoors"]
    end_date = datetime(2026, 9, 30)

    rows = []
    order_counter = 100000

    for cid, persona in zip(customer_ids, personas):
        if persona == 0:  # Loyal high spenders: 12 - 28 orders, recent
            n_orders = np.random.randint(12, 29)
            recency_max_days = 45
            earliest_days = 700
        elif persona == 1:  # Occasional buyers: 3 - 9 orders, spread out
            n_orders = np.random.randint(3, 10)
            recency_max_days = 200
            earliest_days = 600
        elif persona == 2:  # New customers: 1 - 3 orders, very recent
            n_orders = np.random.randint(1, 4)
            recency_max_days = 60
            earliest_days = 75
        else:  # Lapsed customers: 2 - 6 orders, long ago (> 250 days ago)
            n_orders = np.random.randint(2, 7)
            recency_max_days = 650
            earliest_days = 720

        # Generate timestamps
        if persona == 3:
            # Lapsed: between 250 and 720 days ago
            days_ago = np.random.uniform(250, earliest_days, size=n_orders)
        else:
            days_ago = np.random.uniform(1, earliest_days, size=n_orders)
            # Ensure at least one order is near recency_max_days
            days_ago[0] = np.random.uniform(1, recency_max_days)

        days_ago.sort()

        for d in days_ago:
            order_counter += 1
            order_id = f"ORD-{order_counter}"
            order_date = (end_date - timedelta(days=float(d))).strftime("%Y-%m-%d %H:%M:%S")
            category = np.random.choice(categories)

            # Amounts: skewed log-normal
            if persona == 0:
                amount = float(np.random.lognormal(mean=5.2, sigma=0.6))  # ~$180
            elif persona == 1:
                amount = float(np.random.lognormal(mean=4.2, sigma=0.7))  # ~$75
            elif persona == 2:
                amount = float(np.random.lognormal(mean=4.4, sigma=0.6))  # ~$90
            else:
                amount = float(np.random.lognormal(mean=3.9, sigma=0.7))  # ~$55

            amount = round(max(5.0, amount), 2)
            rows.append({
                "order_id": order_id,
                "customer_id": cid,
                "order_date": order_date,
                "amount": amount,
                "category": category
            })

    df_trans = pd.DataFrame(rows)

    # Inject data quality anomalies for realistic ingestion checks
    # 1. A few returns (negative amounts: ~1.2% of orders)
    return_indices = np.random.choice(len(df_trans), size=int(len(df_trans) * 0.012), replace=False)
    for idx in return_indices:
        df_trans.at[idx, "amount"] = -round(abs(df_trans.at[idx, "amount"] * 0.8), 2)

    # 2. A few missing values in category (~0.8%)
    missing_cat_idx = np.random.choice(len(df_trans), size=int(len(df_trans) * 0.008), replace=False)
    for idx in missing_cat_idx:
        df_trans.at[idx, "category"] = None

    # 3. A few duplicate rows (~15 rows)
    dup_sample = df_trans.iloc[:15].copy()
    df_trans = pd.concat([df_trans, dup_sample], ignore_index=True)

    # Shuffle
    df_trans = df_trans.sample(frac=1.0, random_state=42).reset_index(drop=True)

    trans_path = sample_dir / "online_store_transactions.csv"
    df_trans.to_csv(trans_path, index=False)
    df_trans.to_csv(frontend_samples_dir / "online_store_transactions.csv", index=False)
    print(f"Generated {len(df_trans)} transaction rows saved to {trans_path}")

    # ----------------------------------------------------
    # 2. Mall Customers
    # ----------------------------------------------------
    print("Generating mall_customers.csv...")
    n_mall = 500
    mall_rows = []

    # 5 natural clusters:
    # 1: Young, High Income, High Spend (18-35, 75-130k, 70-98 spend)
    # 2: Young, Low Income, High Spend (18-30, 15-40k, 60-95 spend)
    # 3: Mature, High Income, Low Spend (35-65, 75-135k, 10-38 spend)
    # 4: Mature, Low Income, Low Spend (40-70, 15-40k, 5-35 spend)
    # 5: Middle Balanced (25-55, 45-75k, 40-60 spend)

    cluster_sizes = [100, 100, 100, 100, 100]
    c_id = 1

    for c_idx, size in enumerate(cluster_sizes):
        for _ in range(size):
            if c_idx == 0:  # High income, High spend
                age = int(np.clip(np.random.normal(28, 4), 18, 38))
                income = int(np.clip(np.random.normal(90, 12), 65, 135))
                spend = int(np.clip(np.random.normal(82, 8), 65, 99))
                visits = int(np.clip(np.random.normal(8, 2), 4, 15))
            elif c_idx == 1:  # Low income, High spend
                age = int(np.clip(np.random.normal(24, 3), 18, 32))
                income = int(np.clip(np.random.normal(28, 6), 15, 42))
                spend = int(np.clip(np.random.normal(78, 9), 60, 98))
                visits = int(np.clip(np.random.normal(6, 2), 2, 12))
            elif c_idx == 2:  # High income, Low spend
                age = int(np.clip(np.random.normal(48, 8), 35, 68))
                income = int(np.clip(np.random.normal(92, 14), 70, 138))
                spend = int(np.clip(np.random.normal(22, 7), 5, 40))
                visits = int(np.clip(np.random.normal(3, 1), 1, 6))
            elif c_idx == 3:  # Low income, Low spend
                age = int(np.clip(np.random.normal(52, 9), 35, 72))
                income = int(np.clip(np.random.normal(26, 6), 15, 42))
                spend = int(np.clip(np.random.normal(20, 8), 4, 38))
                visits = int(np.clip(np.random.normal(2, 1), 1, 5))
            else:  # Middle balanced
                age = int(np.clip(np.random.normal(42, 10), 22, 65))
                income = int(np.clip(np.random.normal(55, 8), 42, 78))
                spend = int(np.clip(np.random.normal(50, 6), 38, 62))
                visits = int(np.clip(np.random.normal(4, 1), 2, 8))

            mall_rows.append({
                "customer_id": f"MALL-{1000 + c_id}",
                "age": age,
                "annual_income_k": income,
                "spending_score": spend,
                "visits_per_month": visits
            })
            c_id += 1

    df_mall = pd.DataFrame(mall_rows)
    # Shuffle
    df_mall = df_mall.sample(frac=1.0, random_state=42).reset_index(drop=True)

    mall_path = sample_dir / "mall_customers.csv"
    df_mall.to_csv(mall_path, index=False)
    df_mall.to_csv(frontend_samples_dir / "mall_customers.csv", index=False)
    print(f"Generated {len(df_mall)} mall rows saved to {mall_path}")

if __name__ == "__main__":
    generate_datasets()
