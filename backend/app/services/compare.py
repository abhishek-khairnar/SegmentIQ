from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import adjusted_rand_score
from app.models import SegmentationRun, Segment, Assignment

def interpret_ari(ari: float) -> str:
    if ari >= 0.85:
        return "Nearly identical grouping: both methods partition customers with high structural alignment."
    elif ari >= 0.65:
        return "Strong agreement: majority of customers stay in corresponding behavioral clusters."
    elif ari >= 0.45:
        return "Moderate overlap: core groups align, but boundary customers are classified differently."
    elif ari >= 0.20:
        return "Low agreement: algorithms prioritize different dimensions, leading to marked shifts."
    else:
        return "Little to no correlation: the two segmentation runs produce fundamentally different clusters."

def compare_runs_service(
    run_a: SegmentationRun,
    run_b: SegmentationRun,
    segments_a: List[Segment],
    segments_b: List[Segment],
    assignments_a: List[Assignment],
    assignments_b: List[Assignment]
) -> Dict[str, Any]:
    # Build maps of customer_id -> segment_id
    map_a = {a.customer_id: a.segment_id for a in assignments_a}
    map_b = {b.customer_id: b.segment_id for b in assignments_b}

    shared_cids = sorted(list(set(map_a.keys()).intersection(set(map_b.keys()))))
    if not shared_cids:
        raise ValueError("Selected runs have no common customer IDs to compare.")

    seg_a_dict = {s.id: s for s in segments_a}
    seg_b_dict = {s.id: s for s in segments_b}

    sorted_segs_a = sorted(segments_a, key=lambda s: s.index)
    sorted_segs_b = sorted(segments_b, key=lambda s: s.index)

    seg_a_indices = {s.id: i for i, s in enumerate(sorted_segs_a)}
    seg_b_indices = {s.id: i for i, s in enumerate(sorted_segs_b)}

    labels_a = [map_a[cid] for cid in shared_cids]
    labels_b = [map_b[cid] for cid in shared_cids]

    ari = float(adjusted_rand_score(labels_a, labels_b))

    # Contingency matrix
    matrix = np.zeros((len(sorted_segs_a), len(sorted_segs_b)), dtype=int)
    for cid in shared_cids:
        idx_a = seg_a_indices.get(map_a[cid])
        idx_b = seg_b_indices.get(map_b[cid])
        if idx_a is not None and idx_b is not None:
            matrix[idx_a, idx_b] += 1

    # Movement flows and shifts
    flows = []
    shifts = []
    total_shared = len(shared_cids)

    for i, s_a in enumerate(sorted_segs_a):
        row_total = int(np.sum(matrix[i, :]))
        for j, s_b in enumerate(sorted_segs_b):
            cnt = int(matrix[i, j])
            pct_of_a = round(float(cnt / row_total * 100), 2) if row_total > 0 else 0.0
            flows.append({
                "segment_a_id": s_a.id,
                "segment_a_name": s_a.name,
                "segment_b_id": s_b.id,
                "segment_b_name": s_b.name,
                "count": cnt,
                "pct_of_a": pct_of_a
            })

            # Off-diagonal transitions (where names differ or index differ)
            if s_a.name != s_b.name and cnt > 0:
                shifts.append({
                    "segment_a_name": s_a.name,
                    "segment_b_name": s_b.name,
                    "count": cnt,
                    "pct": round(float(cnt / total_shared * 100), 2)
                })

    # Sort shifts by count descending
    shifts.sort(key=lambda x: x["count"], reverse=True)
    top_5_shifts = shifts[:5]

    return {
        "run_a": {
            "id": run_a.id,
            "name": run_a.name,
            "method": run_a.method,
            "n_segments": run_a.n_segments,
            "created_at": run_a.created_at
        },
        "run_b": {
            "id": run_b.id,
            "name": run_b.name,
            "method": run_b.method,
            "n_segments": run_b.n_segments,
            "created_at": run_b.created_at
        },
        "shared_customers": len(shared_cids),
        "ari": round(ari, 4),
        "ari_interpretation": interpret_ari(ari),
        "matrix": matrix.tolist(),
        "labels_a": [s.name for s in sorted_segs_a],
        "labels_b": [s.name for s in sorted_segs_b],
        "flows": flows,
        "top_shifts": top_5_shifts
    }
