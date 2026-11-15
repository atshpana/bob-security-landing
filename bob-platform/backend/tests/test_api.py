import pytest
from fastapi.testclient import TestClient
from app.main import app, state, SEED_STATE
from app.policy import DemoActor, preflight, prove_result
from copy import deepcopy
from datetime import datetime, timedelta, timezone
@pytest.fixture(autouse=True)
def reset_data():
    state.clear();state.update(deepcopy(SEED_STATE))
@pytest.fixture
def client():
    return TestClient(app)
def get(client,path,role="owner"):
    return client.get(path,headers={"x-demo-role":role})
def post(client,path,body,role="owner"):
    return client.post(path,json=body,headers={"x-demo-role":role})
def test_document_contracts(client):
    payload=get(client,"/api/v1/catalog").json()
    assert len(payload["screens"])==104
    assert len(payload["subflows"])==35
    assert len(payload["capabilities"])==40
    assert payload["model"]["stack"]["database"]=="MySQL"
    assert payload["model"]["stack"]["android_ui"]=="Flutter"
def test_default_demo_not_connected(client):
    x=get(client,"/api/v1/status").json()
    assert x["mysql"] is False and x["redis"] is False
    assert x["android_command_execution"] is False
def test_all_user_role_scopes(client):
    assert len(get(client,"/api/v1/state","owner").json()["devices"])==1
    assert len(get(client,"/api/v1/state","enterprise").json()["devices"])==1
    for role in ("family","support","partner","admin"):
        state=get(client,"/api/v1/state",role).json()
        assert state["devices"]==[] and state["commands"]==[]
def test_family_invite_fails_closed_until_age_policy_set(client):
    x=post(client,"/api/v1/family/invites",{},role="family")
    assert x.status_code==403 and "CFG_AGE_002" in x.text
def test_no_arbitrary_or_other_tenant_commands(client):
    x=post(client,"/api/v1/commands/demo",{"device_id":"d-personal-1","action":"WIPE"})
    assert x.status_code==403 and x.json()["code"]=="COMMAND_NOT_ALLOWLISTED"
    y=post(client,"/api/v1/commands/demo",{"device_id":"d-personal-1","action":"ALERT_TEST"},role="enterprise")
    assert y.status_code==403 and y.json()["code"]=="TARGET_NOT_AUTHORIZED"
def test_accepted_demo_command_has_no_success_without_evidence(client):
    x=post(client,"/api/v1/commands/demo",{"device_id":"d-personal-1","action":"STATUS_REFRESH"})
    assert x.status_code==201
    assert x.json()["command"]["state"]=="RESULT_UNCONFIRMED"
    assert x.json()["command"]["simulated"]
    assert prove_result({"verified": True, "source": "foo"})=="RESULT_UNCONFIRMED"
def test_stale_probe_blocks_even_demo():
    probe={"id":"x","owner_id":"demo-owner","kind":"PERSONAL","connection":"ONLINE",
           "capabilities":{"status":{"state":"SUPPORTED","checked_at":(datetime.now(timezone.utc)-timedelta(minutes=10)).isoformat()}}}
    assert preflight(DemoActor.from_role("owner"),probe,"STATUS_REFRESH")["code"]=="CAPABILITY_STALE"
def test_nonowner_cannot_read_incident(client):
    inc=post(client,"/api/v1/incidents/demo",{"subject":"حادث تجريبي"}).json()["incident"]
    x=post(client,"/api/v1/forensics/report-preview",{"incident_id":inc["id"]},"enterprise")
    assert x.status_code==403
    y=post(client,"/api/v1/forensics/report-preview",{"incident_id":inc["id"]})
    assert y.json()["report"]["official"] is False
def test_deletion_requires_real_authenticated_database(client):
    assert post(client,"/api/v1/account/deletion-request",{"acknowledge":True}).status_code==503
def test_input_contract_strict(client):
    assert post(client,"/api/v1/incidents/demo",{"subject":"a"}).status_code==422
    assert post(client,"/api/v1/incidents/demo",{"subject":"valid","enterprise_id":"other"}).status_code==422
