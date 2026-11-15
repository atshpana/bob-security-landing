"""FastAPI pre-database implementation — BOB 4.0, no production integrations."""
from datetime import datetime, timezone
from copy import deepcopy
import json
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import DATA_DIR, Settings
from .policy import COMMANDS, DemoActor, preflight, project_for_actor, RESULT_UNCONFIRMED, owns
from .schemas import (CommandRequest, IncidentDraft, TicketDraft, PolicyDraft,
                      ReportPreviewRequest, AccountDeletionRequest)

SETTINGS = Settings.load()
app = FastAPI(title="BOB Security — Pre-DB Demo Contracts", version="0.1.0",
              docs_url="/docs", redoc_url=None)
# Same-origin only in a demo. Real CORS, auth, CSRF, rate limits and host config
# require deployment-qualified settings and tests.
app.add_middleware(CORSMiddleware, allow_origins=[], allow_methods=["GET", "POST"],
                   allow_headers=["x-demo-role", "content-type"])
class SecurityHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-BOB-Mode"] = "DEMO_ONLY_NOT_PRODUCTION"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response
app.add_middleware(SecurityHeaders)

def now():
    return datetime.now(timezone.utc).isoformat()

def capability():
    return {k: {"state": "SUPPORTED", "checked_at": now(), "source": "SYNTHETIC_DEMO"}
            for k in ("status", "alert", "recovery")}

SEED_STATE = {
    "devices": [
        {"id": "d-personal-1", "name": "هاتف شخصي تجريبي", "owner_id": "demo-owner",
         "enterprise_id": None, "kind": "PERSONAL", "connection": "ONLINE",
         "mode": "NORMAL", "last_location": None, "capabilities": capability()},
        {"id": "d-managed-1", "name": "جهاز مؤسسة تجريبي", "owner_id": None,
         "enterprise_id": "demo-tenant", "kind": "MANAGED", "connection": "ONLINE",
         "mode": "COMPLIANT_DEMO", "last_location": None, "capabilities": capability()}
    ],
    "incidents": [],
    "commands": [],
    "tickets": [],
    "family": {"seat_limit": 5, "seats_used": 2, "members": [
        {"name": "مالك الباقة", "role": "SUBSCRIBER"}, {"name": "عضو بالغ", "role": "ADULT"}
    ], "invites_enabled": False, "age_market_policy": "CFG-AGE-002_NOT_CONFIGURED"},
    "enterprise": {"name": "مؤسسة تجريبية", "policies": [], "amapi": "PRODUCTION_DISABLED"},
    "users": [{"id": "demo-owner", "name": "حساب وهمي"}],
    "content": [], "audit": []
}
state = deepcopy(SEED_STATE)

def audit(actor: DemoActor, action: str, target: str):
    state["audit"].insert(0, {"id": str(uuid4()), "at": now(), "role": actor.role,
                              "action": action, "target": target[:80], "demo": True})
    del state["audit"][100:]

def actor(x_demo_role: str = Header(default="owner")):
    try:
        return DemoActor.from_role(x_demo_role)
    except ValueError:
        raise HTTPException(403, "ROLE_INVALID")

def deny(code: str, status: int = 403):
    raise HTTPException(status_code=status, detail=code)

def catalog(filename: str):
    with open(DATA_DIR / filename, encoding="utf-8") as handle:
        return json.load(handle)

@app.get("/api/v1/status")
def status():
    return {"mode": "DEMO_ONLY", "mysql": False, "redis": False,
            "authentication": "NOT_CONNECTED", "android_command_execution": False,
            "play_billing": False, "amapi": False, "source": "BOB_4_0_OWNER_APPROVED_FROZEN"}

@app.get("/api/v1/catalog")
def get_catalog():
    return {"model": catalog("product-model.json"), "screens": catalog("screens.json"),
            "subflows": catalog("subflows.json"),
            "capabilities": catalog("capabilities.json")}

@app.get("/api/v1/state")
def get_state(user: DemoActor = Depends(actor)):
    return project_for_actor(user, state)

@app.post("/api/v1/commands/preflight")
def command_preflight(payload: CommandRequest, user: DemoActor = Depends(actor)):
    device = next((x for x in state["devices"] if x["id"] == payload.device_id), None)
    return preflight(user, device, payload.action)

@app.post("/api/v1/commands/demo")
def command_demo(payload: CommandRequest, user: DemoActor = Depends(actor)):
    device = next((x for x in state["devices"] if x["id"] == payload.device_id), None)
    result = preflight(user, device, payload.action)
    if not result["allowed"]:
        return JSONResponse(status_code=403, content=result)
    command = {"id": str(uuid4()), "device_id": payload.device_id,
               "action": payload.action, "state": RESULT_UNCONFIRMED,
               "role": user.role, "simulated": True, "evidence": None, "created_at": now()}
    state["commands"].insert(0, command)
    audit(user, "SIMULATED_COMMAND", payload.device_id)
    return JSONResponse(status_code=201, content={"command": command,
      "notice": "محاكاة واجهة فقط. لم يُرسل أي أمر إلى Android."})

@app.post("/api/v1/incidents/demo", status_code=201)
def incident_demo(payload: IncidentDraft, user: DemoActor = Depends(actor)):
    if user.role not in ("owner", "enterprise"):
        deny("FORBIDDEN")
    incident = {"id": str(uuid4()), "subject": payload.subject,
                "owner_id": user.account_id, "enterprise_id": user.tenant_id,
                "state": "OPEN_DEMO", "evidence_count": 0, "created_at": now()}
    state["incidents"].insert(0, incident)
    audit(user, "INCIDENT_DRAFT", incident["id"])
    return {"incident": incident}

@app.post("/api/v1/support/tickets/demo", status_code=201)
def ticket_demo(payload: TicketDraft, user: DemoActor = Depends(actor)):
    if user.role not in ("owner", "family"):
        deny("FORBIDDEN")
    ticket = {"id": str(uuid4()), "subject": payload.subject, "status": "OPEN_DEMO",
              "owner_role": user.role, "created_at": now()}
    state["tickets"].insert(0, ticket)
    return {"ticket": ticket}

@app.post("/api/v1/family/invites")
def family_invite_blocked(user: DemoActor = Depends(actor)):
    if user.role != "family":
        deny("FORBIDDEN")
    # §2.2.2: market-specific age rule CFG-AGE-002 is not established.
    deny("CFG_AGE_002_NOT_CONFIGURED")

@app.post("/api/v1/enterprise/policies/demo", status_code=201)
def policy_draft(payload: PolicyDraft, user: DemoActor = Depends(actor)):
    if user.role != "enterprise":
        deny("FORBIDDEN")
    value = {"id": str(uuid4()), "name": payload.name, "state": "DRAFT_NOT_APPLIED"}
    state["enterprise"]["policies"].append(value)
    audit(user, "POLICY_DRAFT", value["id"])
    return {"policy": value}

@app.post("/api/v1/forensics/report-preview")
def report_preview(payload: ReportPreviewRequest, user: DemoActor = Depends(actor)):
    if user.role not in ("owner", "enterprise"):
        deny("FORBIDDEN")
    incident = next((i for i in state["incidents"]
                     if i["id"] == payload.incident_id and
                     ((user.role == "owner" and i["owner_id"] == user.account_id) or
                      (user.role == "enterprise" and i["enterprise_id"] == user.tenant_id))), None)
    if incident is None:
        deny("INCIDENT_NOT_AUTHORIZED")
    audit(user, "REPORT_PREVIEW", incident["id"])
    return {"report": {"incident_id": incident["id"], "issued": False,
            "signature": "NOT_SIGNED", "verification_id": None,
            "evidence_count": 0, "official": False}}

@app.post("/api/v1/account/deletion-request")
def deletion_request(payload: AccountDeletionRequest):
    # §9.13: true deletion needs reauthentication, revocation, DB & processor cleanup.
    deny("DATABASE_AND_REAUTH_NOT_CONNECTED", status=503)

@app.get("/api/v1/integrations")
def integrations():
    return {"mysql": "NOT_CONNECTED", "redis": "NOT_CONNECTED",
            "fcm": "NOT_CONFIGURED", "play_integrity": "NOT_CONFIGURED",
            "amapi": "PRODUCTION_DISABLED", "play_billing": "NOT_CONFIGURED",
            "evidence_object_store": "NOT_CONNECTED",
            "ai_support": "GATED", "ai_guard": "DISABLED"}

@app.get("/")
def home():
    return {"product": "BOB Security", "source": "BOB 4.0", "mode": "DEMO_ONLY",
            "openapi": "/docs", "web": "React / bob-platform/web",
            "mobile": "Flutter + Kotlin / bob-platform/mobile"}
