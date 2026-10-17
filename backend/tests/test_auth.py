import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_full_lifecycle():
    # 1. Register new user
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@segmentiq.com"
    reg_payload = {
        "email": unique_email,
        "name": "Alex Tester",
        "password": "Password123!"
    }
    res_reg = client.post("/api/auth/register", json=reg_payload)
    assert res_reg.status_code == 201
    user_data = res_reg.json()
    assert user_data["email"] == unique_email
    assert "id" in user_data
    # Cookie should be set
    assert "segmentiq_token" in res_reg.cookies

    cookies = {"segmentiq_token": res_reg.cookies["segmentiq_token"]}

    # 2. Duplicate registration rejected
    res_dup = client.post("/api/auth/register", json=reg_payload)
    assert res_dup.status_code == 400

    # 3. Check /api/auth/me
    res_me = client.get("/api/auth/me", cookies=cookies)
    assert res_me.status_code == 200
    assert res_me.json()["name"] == "Alex Tester"

    # 4. Patch /api/auth/me
    res_patch = client.patch("/api/auth/me", json={"name": "Alex Updated", "theme": "dark"}, cookies=cookies)
    assert res_patch.status_code == 200
    assert res_patch.json()["name"] == "Alex Updated"
    assert res_patch.json()["theme"] == "dark"

    # 5. Change password
    res_pw = client.post("/api/auth/change-password", json={
        "current_password": "Password123!",
        "new_password": "NewSecurePassword456!"
    }, cookies=cookies)
    assert res_pw.status_code == 200

    # 6. Logout
    res_logout = client.post("/api/auth/logout")
    assert res_logout.status_code == 200

    # 7. Login with old password fails
    res_login_bad = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "Password123!"
    })
    assert res_login_bad.status_code == 401

    # 8. Login with new password succeeds
    res_login_ok = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "NewSecurePassword456!"
    })
    assert res_login_ok.status_code == 200
    new_cookies = {"segmentiq_token": res_login_ok.cookies["segmentiq_token"]}

    # 9. Delete account
    res_del = client.delete("/api/auth/me", cookies=new_cookies)
    assert res_del.status_code == 200

    # 10. Access after deletion fails
    res_after = client.get("/api/auth/me", cookies=new_cookies)
    assert res_after.status_code == 401
