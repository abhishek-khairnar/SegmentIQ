import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.routers.runs import execute_segmentation_task

client = TestClient(app)

import uuid

def create_authenticated_user(name: str):
    email = f"user_{uuid.uuid4().hex[:8]}@segmentiq.com"
    res = client.post("/api/auth/register", json={
        "email": email,
        "name": name,
        "password": "Password123!"
    })
    assert res.status_code == 201
    return {"segmentiq_token": res.cookies["segmentiq_token"]}

def test_runs_api_end_to_end_and_isolation():
    # 1. Create User A and User B
    cookies_a = create_authenticated_user("User Alpha")
    cookies_b = create_authenticated_user("User Beta")

    # 2. User A loads sample dataset 'mall_customers'
    res_sample = client.post("/api/datasets/sample/mall_customers", cookies=cookies_a)
    assert res_sample.status_code == 201
    dataset_a = res_sample.json()
    dataset_a_id = dataset_a["id"]
    assert dataset_a["row_count"] == 500

    # 3. User B tries to access User A's dataset -> must get 404
    res_b_access = client.get(f"/api/datasets/{dataset_a_id}", cookies=cookies_b)
    assert res_b_access.status_code == 404

    # 4. User A suggests k
    res_sug_k = client.post(f"/api/datasets/{dataset_a_id}/suggest-k", json={
        "features": ["age", "annual_income_k", "spending_score", "visits_per_month"]
    }, cookies=cookies_a)
    assert res_sug_k.status_code == 200
    assert "best_k" in res_sug_k.json()

    # 5. User A creates K-Means run
    res_run = client.post("/api/runs", json={
        "dataset_id": dataset_a_id,
        "name": "Mall K-Means Test Run",
        "method": "kmeans",
        "features": ["annual_income_k", "spending_score"],
        "params": {"k": 5}
    }, cookies=cookies_a)
    assert res_run.status_code == 201
    run_a = res_run.json()
    run_a_id = run_a["id"]

    # Directly run background task function to execute synchronously for the test
    execute_segmentation_task(run_a_id)

    # 6. Retrieve run status
    res_run_status = client.get(f"/api/runs/{run_a_id}", cookies=cookies_a)
    assert res_run_status.status_code == 200
    run_detail = res_run_status.json()
    assert run_detail["status"] == "done"
    assert run_detail["n_segments"] == 5
    assert run_detail["n_customers"] == 500

    # 7. User B tries to view or delete User A's run -> must get 404
    res_b_run = client.get(f"/api/runs/{run_a_id}", cookies=cookies_b)
    assert res_b_run.status_code == 404
    res_b_del = client.delete(f"/api/runs/{run_a_id}", cookies=cookies_b)
    assert res_b_del.status_code == 404

    # 8. Check segments list and map
    res_segs = client.get(f"/api/runs/{run_a_id}/segments", cookies=cookies_a)
    assert res_segs.status_code == 200
    segs = res_segs.json()
    assert len(segs) == 5

    res_map = client.get(f"/api/runs/{run_a_id}/map", cookies=cookies_a)
    assert res_map.status_code == 200
    assert len(res_map.json()["points"]) == 500

    # 9. Test rename segment
    first_seg_id = segs[0]["id"]
    res_patch_seg = client.patch(f"/api/segments/{first_seg_id}", json={
        "name": "Custom Elite Spenders"
    }, cookies=cookies_a)
    assert res_patch_seg.status_code == 200
    assert res_patch_seg.json()["name"] == "Custom Elite Spenders"

    # 10. Test exports
    res_exp_cust = client.get(f"/api/runs/{run_a_id}/export/customers.csv", cookies=cookies_a)
    assert res_exp_cust.status_code == 200
    assert res_exp_cust.headers["content-type"] == "text/csv; charset=utf-8"
    assert b"\xef\xbb\xbf" in res_exp_cust.content[:3]  # UTF-8 BOM

    res_exp_segs = client.get(f"/api/runs/{run_a_id}/export/segments.csv", cookies=cookies_a)
    assert res_exp_segs.status_code == 200
    assert b"Custom Elite Spenders" in res_exp_segs.content

    res_exp_json = client.get(f"/api/runs/{run_a_id}/export/run.json", cookies=cookies_a)
    assert res_exp_json.status_code == 200
    assert res_exp_json.json()["run_id"] == run_a_id
