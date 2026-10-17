import time
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from scipy.stats import skew
from app.services.rfm import SEGMENT_COLORS
from app.services.naming import generate_segment_name_and_actions

def preprocess_features(
    df: pd.DataFrame,
    feature_cols: List[str],
    apply_log: bool = True,
    apply_cap: bool = True
) -> Tuple[np.ndarray, pd.DataFrame, StandardScaler, Dict[str, Any]]:
    X_raw = df[feature_cols].copy()
    meta: Dict[str, Any] = {
        "log_transformed_features": [],
        "capped_features": []
    }

    # Fill any remaining NaNs in numeric columns with column median
    for col in feature_cols:
        if X_raw[col].isna().sum() > 0:
            X_raw[col] = X_raw[col].fillna(X_raw[col].median())

    X_processed = X_raw.copy()

    # Outlier capping at 1st and 99th percentiles
    if apply_cap:
        for col in feature_cols:
            q01 = float(X_processed[col].quantile(0.01))
            q99 = float(X_processed[col].quantile(0.99))
            if q99 > q01:
                X_processed[col] = X_processed[col].clip(lower=q01, upper=q99)
                meta["capped_features"].append(col)

    # Log1p transform for skewed features (skew > 1)
    if apply_log:
        for col in feature_cols:
            col_min = float(X_processed[col].min())
            # Shift if min < 0 to ensure non-negative before log
            if col_min < 0:
                shift = abs(col_min) + 1.0
                vals = X_processed[col] + shift
            else:
                vals = X_processed[col]

            col_skew = float(skew(vals))
            if col_skew > 1.0:
                X_processed[col] = np.log1p(np.maximum(0, vals))
                meta["log_transformed_features"].append(col)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_processed.values)

    return X_scaled, X_raw, scaler, meta

def suggest_k(
    df: pd.DataFrame,
    feature_cols: List[str],
    apply_log: bool = True,
    apply_cap: bool = True
) -> Dict[str, Any]:
    X_scaled, _, _, _ = preprocess_features(df, feature_cols, apply_log, apply_cap)
    n_samples = len(X_scaled)
    max_k = min(10, n_samples - 1)
    if max_k < 2:
        return {"k_values": [2], "inertias": [0.0], "silhouettes": [0.0], "best_k": 2}

    k_values = list(range(2, max_k + 1))
    inertias = []
    silhouettes = []

    # Sample for silhouette if dataset is large to maintain fast UI response
    sample_size = min(3000, n_samples)
    sample_indices = np.random.RandomState(42).choice(n_samples, size=sample_size, replace=False) if n_samples > sample_size else None

    for k in k_values:
        km = KMeans(n_clusters=k, n_init=10, random_state=42)
        km.fit(X_scaled)
        inertias.append(round(float(km.inertia_), 2))

        labels = km.labels_
        if sample_indices is not None:
            sil = silhouette_score(X_scaled[sample_indices], labels[sample_indices])
        else:
            sil = silhouette_score(X_scaled, labels)
        silhouettes.append(round(float(sil), 4))

    best_idx = int(np.argmax(silhouettes))
    best_k = k_values[best_idx]

    return {
        "k_values": k_values,
        "inertias": inertias,
        "silhouettes": silhouettes,
        "best_k": best_k
    }

def suggest_eps(
    df: pd.DataFrame,
    feature_cols: List[str],
    min_samples: int = 5,
    apply_log: bool = True,
    apply_cap: bool = True
) -> Dict[str, Any]:
    X_scaled, _, _, _ = preprocess_features(df, feature_cols, apply_log, apply_cap)
    n_samples = len(X_scaled)
    k = max(2, min(min_samples, n_samples - 1))

    # Compute k-nearest neighbors distances
    nbrs = NearestNeighbors(n_neighbors=k).fit(X_scaled)
    distances, _ = nbrs.kneighbors(X_scaled)
    k_distances = np.sort(distances[:, k - 1])

    # Subsample if large for UI chart
    step = max(1, len(k_distances) // 100)
    sampled_distances = [round(float(d), 4) for d in k_distances[::step]]

    # Knee point detection using maximum perpendicular distance to the line between first and last points
    n_points = len(k_distances)
    x = np.arange(n_points)
    p1 = np.array([0, k_distances[0]])
    p2 = np.array([n_points - 1, k_distances[-1]])
    line_vec = p2 - p1
    line_len = np.linalg.norm(line_vec)

    if line_len > 0:
        norm_vec = np.array([-line_vec[1], line_vec[0]]) / line_len
        distances_to_line = np.abs(np.array([np.dot(np.array([x[i], k_distances[i]]) - p1, norm_vec) for i in range(n_points)]))
        knee_idx = int(np.argmax(distances_to_line))
        suggested_eps = round(float(k_distances[knee_idx]), 3)
    else:
        suggested_eps = round(float(np.median(k_distances)), 3)

    suggested_eps = max(0.1, suggested_eps)

    return {
        "distances": sampled_distances,
        "suggested_eps": suggested_eps
    }

def run_clustering(
    df: pd.DataFrame,
    customer_id_col: str,
    feature_cols: List[str],
    method: str,
    params: Dict[str, Any],
    apply_log: bool = True,
    apply_cap: bool = True
) -> Dict[str, Any]:
    start_time = time.time()
    n_samples = len(df)
    customer_ids = df[customer_id_col].astype(str).tolist()

    X_scaled, X_raw, scaler, prep_meta = preprocess_features(df, feature_cols, apply_log, apply_cap)

    warning_notes = []

    # 1. Execute Clustering
    if method == "kmeans":
        k = int(params.get("k", 4))
        k = max(2, min(k, n_samples - 1))
        model = KMeans(n_clusters=k, n_init=10, random_state=42)
        labels = model.fit_predict(X_scaled)
        inertia = float(model.inertia_)

    elif method == "hierarchical":
        k = int(params.get("k", 4))
        k = max(2, min(k, n_samples - 1))
        linkage = params.get("linkage", "ward")
        if linkage not in ["ward", "complete", "average"]:
            linkage = "ward"

        if n_samples > 20000:
            warning_notes.append("Large dataset (>20,000 rows): Hierarchical clustering fitted on stratified sample of 20,000; remaining assigned to nearest centroid.")
            sample_idx = np.random.RandomState(42).choice(n_samples, size=20000, replace=False)
            model = AgglomerativeClustering(n_clusters=k, linkage=linkage)
            sample_labels = model.fit_predict(X_scaled[sample_idx])

            # Calculate sample centroids
            centroids = [X_scaled[sample_idx][sample_labels == ci].mean(axis=0) for ci in range(k)]
            from scipy.spatial.distance import cdist
            dists = cdist(X_scaled, np.array(centroids))
            labels = np.argmin(dists, axis=1)
        else:
            model = AgglomerativeClustering(n_clusters=k, linkage=linkage)
            labels = model.fit_predict(X_scaled)
        inertia = None

    elif method == "dbscan":
        eps = float(params.get("eps", 0.5))
        min_samples = int(params.get("min_samples", 5))
        model = DBSCAN(eps=eps, min_samples=min_samples)
        labels = model.fit_predict(X_scaled)
        inertia = None

    else:
        raise ValueError(f"Unsupported clustering method: {method}")

    # Check number of valid clusters
    unique_labels = sorted(list(set(labels)))
    non_noise_labels = [l for l in unique_labels if l != -1]

    if len(non_noise_labels) < 2:
        raise ValueError(f"Clustering produced {len(non_noise_labels)} valid clusters. Try adjusting parameters (e.g. increase k or reduce eps).")

    # 2. PCA 2D coordinates for map
    pca = PCA(n_components=2, random_state=42)
    pca_coords = pca.fit_transform(X_scaled)
    pca_x = [round(float(c[0]), 3) for c in pca_coords]
    pca_y = [round(float(c[1]), 3) for c in pca_coords]

    # 3. Calculate Clustering Quality Metrics
    valid_mask = labels != -1 if -1 in labels else np.ones(len(labels), dtype=bool)
    if np.sum(valid_mask) > len(non_noise_labels) and len(non_noise_labels) > 1:
        X_eval = X_scaled[valid_mask]
        labels_eval = labels[valid_mask]

        # Sample for silhouette if over 10,000
        if len(X_eval) > 10000:
            eval_idx = np.random.RandomState(42).choice(len(X_eval), size=10000, replace=False)
            sil = float(silhouette_score(X_eval[eval_idx], labels_eval[eval_idx]))
        else:
            sil = float(silhouette_score(X_eval, labels_eval))

        db = float(davies_bouldin_score(X_eval, labels_eval))
        ch = float(calinski_harabasz_score(X_eval, labels_eval))
    else:
        sil, db, ch = 0.0, 0.0, 0.0

    metrics = {
        "silhouette": round(sil, 4),
        "davies_bouldin": round(db, 4),
        "calinski_harabasz": round(ch, 2),
        "pca_variance_ratio": [round(float(v), 4) for v in pca.explained_variance_ratio_]
    }
    if inertia is not None:
        metrics["inertia"] = round(inertia, 2)
    if -1 in unique_labels:
        metrics["noise_count"] = int(np.sum(labels == -1))

    # 4. Generate Segments, Centroids & Profiles
    overall_means = {col: float(X_raw[col].mean()) for col in feature_cols}
    overall_stds = {col: float(X_raw[col].std()) if float(X_raw[col].std()) > 0 else 1.0 for col in feature_cols}

    segments_data = []
    existing_names = []

    # Map label to internal segment index
    label_to_index: Dict[int, int] = {}
    seg_idx_counter = 0

    for lbl in unique_labels:
        mask = labels == lbl
        cluster_size = int(np.sum(mask))
        share_pct = round(float(cluster_size / n_samples * 100), 2)

        if lbl == -1:
            # Noise / outlier cluster
            name = "Noise / Outliers"
            color = "#64748B"
            description = "Atypical records that do not fit neatly into dense behavioral clusters."
            actions = [
                "Investigate potential data anomalies or extreme edge cases",
                "Isolate from automated high-frequency promotional blasts",
                "Flag for manual qualitative review"
            ]
            centroid_raw = {col: round(float(X_raw.loc[mask, col].mean()), 2) for col in feature_cols}
            z_scores = {col: 0.0 for col in feature_cols}
            profile_dict = {
                "raw_means": centroid_raw,
                "overall_means": {c: round(m, 2) for c, m in overall_means.items()},
                "index_ratios": {c: 1.0 for c in feature_cols},
                "z_scores": z_scores
            }
            label_to_index[lbl] = seg_idx_counter
            segments_data.append({
                "index": seg_idx_counter,
                "name": name,
                "description": description,
                "color": color,
                "size": cluster_size,
                "share_pct": share_pct,
                "centroid_json": centroid_raw,
                "profile_json": profile_dict,
                "actions_json": actions
            })
            seg_idx_counter += 1
            continue

        label_to_index[lbl] = seg_idx_counter
        color = SEGMENT_COLORS[seg_idx_counter % len(SEGMENT_COLORS)]

        # Feature means and z-scores
        cluster_raw_means = {col: float(X_raw.loc[mask, col].mean()) for col in feature_cols}
        z_scores = {
            col: round(float((cluster_raw_means[col] - overall_means[col]) / overall_stds[col]), 3)
            for col in feature_cols
        }
        index_ratios = {
            col: round(float(cluster_raw_means[col] / overall_means[col]), 2) if overall_means[col] != 0 else 1.0
            for col in feature_cols
        }

        name, description, actions = generate_segment_name_and_actions(
            segment_idx=seg_idx_counter,
            z_scores=z_scores,
            feature_means=cluster_raw_means,
            overall_means=overall_means,
            existing_names=existing_names
        )
        existing_names.append(name)

        centroid_rounded = {c: round(v, 2) for c, v in cluster_raw_means.items()}
        profile_dict = {
            "raw_means": centroid_rounded,
            "overall_means": {c: round(m, 2) for c, m in overall_means.items()},
            "index_ratios": index_ratios,
            "z_scores": z_scores
        }

        segments_data.append({
            "index": seg_idx_counter,
            "name": name,
            "description": description,
            "color": color,
            "size": cluster_size,
            "share_pct": share_pct,
            "centroid_json": centroid_rounded,
            "profile_json": profile_dict,
            "actions_json": actions
        })
        seg_idx_counter += 1

    # 5. Build assignments
    assignments_data = []
    for i in range(n_samples):
        lbl = labels[i]
        s_idx = label_to_index[lbl]
        assignments_data.append({
            "customer_id": customer_ids[i],
            "segment_index": s_idx,
            "pca_x": pca_x[i],
            "pca_y": pca_y[i],
            "features": {col: round(float(X_raw.iloc[i][col]), 2) for col in feature_cols}
        })

    duration_ms = int((time.time() - start_time) * 1000)

    return {
        "status": "done",
        "duration_ms": duration_ms,
        "n_customers": n_samples,
        "n_segments": len(segments_data),
        "metrics": metrics,
        "segments": segments_data,
        "assignments": assignments_data,
        "warning_notes": warning_notes
    }
