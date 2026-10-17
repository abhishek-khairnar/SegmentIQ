import io
import json
import csv
from typing import List, Dict, Any
from app.models import SegmentationRun, Segment, Assignment

def export_customers_csv(run: SegmentationRun, assignments: List[Assignment], segments_map: Dict[str, Segment]) -> bytes:
    output = io.StringIO()
    # Write UTF-8 BOM
    output.write('\ufeff')

    if not assignments:
        return output.getvalue().encode('utf-8')

    first_feats = json.loads(assignments[0].features_json)
    feature_names = list(first_feats.keys())
    fieldnames = ["customer_id", "segment_name", "segment_index"] + feature_names + ["pca_x", "pca_y"]

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for a in assignments:
        seg = segments_map.get(a.segment_id)
        feats = json.loads(a.features_json)
        row = {
            "customer_id": a.customer_id,
            "segment_name": seg.name if seg else "Unknown",
            "segment_index": seg.index if seg else 0,
            "pca_x": a.pca_x,
            "pca_y": a.pca_y
        }
        for fn in feature_names:
            row[fn] = feats.get(fn, "")
        writer.writerow(row)

    return output.getvalue().encode('utf-8')

def export_segment_audience_csv(segment: Segment, assignments: List[Assignment]) -> bytes:
    output = io.StringIO()
    output.write('\ufeff')

    if not assignments:
        return output.getvalue().encode('utf-8')

    first_feats = json.loads(assignments[0].features_json)
    feature_names = list(first_feats.keys())
    fieldnames = ["customer_id", "segment_name"] + feature_names

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for a in assignments:
        feats = json.loads(a.features_json)
        row = {
            "customer_id": a.customer_id,
            "segment_name": segment.name
        }
        for fn in feature_names:
            row[fn] = feats.get(fn, "")
        writer.writerow(row)

    return output.getvalue().encode('utf-8')

def export_segments_summary_csv(segments: List[Segment]) -> bytes:
    output = io.StringIO()
    output.write('\ufeff')

    fieldnames = ["segment_index", "name", "description", "size", "share_pct", "recommended_actions"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for seg in sorted(segments, key=lambda s: s.index):
        actions = json.loads(seg.actions_json) if seg.actions_json else []
        writer.writerow({
            "segment_index": seg.index,
            "name": seg.name,
            "description": seg.description,
            "size": seg.size,
            "share_pct": f"{seg.share_pct:.2f}%",
            "recommended_actions": " | ".join(actions)
        })

    return output.getvalue().encode('utf-8')

def export_run_json(run: SegmentationRun, segments: List[Segment], assignments: List[Assignment]) -> Dict[str, Any]:
    return {
        "run_id": run.id,
        "name": run.name,
        "method": run.method,
        "created_at": run.created_at.isoformat(),
        "duration_ms": run.duration_ms,
        "metrics": json.loads(run.metrics_json),
        "parameters": json.loads(run.params_json),
        "features": json.loads(run.features_json),
        "n_customers": run.n_customers,
        "n_segments": run.n_segments,
        "segments": [
            {
                "index": s.index,
                "name": s.name,
                "description": s.description,
                "color": s.color,
                "size": s.size,
                "share_pct": s.share_pct,
                "centroid": json.loads(s.centroid_json),
                "profile": json.loads(s.profile_json),
                "actions": json.loads(s.actions_json)
            }
            for s in sorted(segments, key=lambda s: s.index)
        ],
        "customers_sample": [
            {
                "customer_id": a.customer_id,
                "segment_id": a.segment_id,
                "features": json.loads(a.features_json),
                "pca_x": a.pca_x,
                "pca_y": a.pca_y
            }
            for a in assignments[:500]
        ]
    }
