import pytest
import numpy as np
import pandas as pd
from app.services.clustering import preprocess_features, suggest_k, suggest_eps, run_clustering

@pytest.fixture
def sample_feature_df():
    np.random.seed(42)
    n = 120
    # Two distinct clusters
    c1 = np.random.normal(loc=10, scale=2, size=(60, 3))
    c2 = np.random.normal(loc=50, scale=3, size=(60, 3))
    data = np.vstack([c1, c2])
    df = pd.DataFrame(data, columns=["feat_a", "feat_b", "feat_c"])
    df["customer_id"] = [f"CUST_{i}" for i in range(n)]
    return df

def test_preprocessing(sample_feature_df):
    X_scaled, X_raw, scaler, meta = preprocess_features(
        sample_feature_df,
        ["feat_a", "feat_b", "feat_c"],
        apply_log=True,
        apply_cap=True
    )
    assert X_scaled.shape == (120, 3)
    # Scaled means should be approx 0 and std approx 1
    assert np.allclose(X_scaled.mean(axis=0), 0, atol=1e-2)
    assert np.allclose(X_scaled.std(axis=0), 1, atol=1e-2)

def test_suggest_k(sample_feature_df):
    res = suggest_k(sample_feature_df, ["feat_a", "feat_b", "feat_c"])
    assert "k_values" in res
    assert "inertias" in res
    assert "silhouettes" in res
    assert res["best_k"] in [2, 3]

def test_suggest_eps(sample_feature_df):
    res = suggest_eps(sample_feature_df, ["feat_a", "feat_b", "feat_c"], min_samples=5)
    assert "distances" in res
    assert "suggested_eps" in res
    assert res["suggested_eps"] > 0

def test_kmeans_run(sample_feature_df):
    res = run_clustering(
        df=sample_feature_df,
        customer_id_col="customer_id",
        feature_cols=["feat_a", "feat_b", "feat_c"],
        method="kmeans",
        params={"k": 2}
    )
    assert res["status"] == "done"
    assert res["n_segments"] == 2
    assert len(res["segments"]) == 2
    assert len(res["assignments"]) == 120
    assert "silhouette" in res["metrics"]
    assert res["metrics"]["silhouette"] > 0.5

def test_hierarchical_run(sample_feature_df):
    res = run_clustering(
        df=sample_feature_df,
        customer_id_col="customer_id",
        feature_cols=["feat_a", "feat_b", "feat_c"],
        method="hierarchical",
        params={"k": 2, "linkage": "ward"}
    )
    assert res["status"] == "done"
    assert res["n_segments"] == 2

def test_dbscan_run(sample_feature_df):
    res = run_clustering(
        df=sample_feature_df,
        customer_id_col="customer_id",
        feature_cols=["feat_a", "feat_b", "feat_c"],
        method="dbscan",
        params={"eps": 1.5, "min_samples": 5}
    )
    assert res["status"] == "done"
    assert res["n_segments"] >= 2
