"""BOB 4.0: minimum-authority, denied-by-default demo policy.

The x-demo-role header is NEVER a production authentication mechanism.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

ROLES = {"owner", "family", "enterprise", "admin", "partner", "support"}
COMMANDS = {
    "STATUS_REFRESH": {"capability": "status", "plan": "public"},
    "ALERT_TEST": {"capability": "alert", "plan": "public"},
    "RECOVERY_START": {"capability": "recovery", "plan": "personal"},
}
RESULT_UNCONFIRMED = "RESULT_UNCONFIRMED"

@dataclass(frozen=True)
class DemoActor:
    role: str
    account_id: str | None = None
    tenant_id: str | None = None

    @classmethod
    def from_role(cls, role: str):
        if role not in ROLES:
            raise ValueError("ROLE_INVALID")
        return cls(role, "demo-owner" if role == "owner" else None,
                   "demo-tenant" if role == "enterprise" else None)

def owns(actor: DemoActor, device: dict[str, Any] | None) -> bool:
    if not device:
        return False
    return bool(
        (actor.role == "owner" and device.get("owner_id") == actor.account_id
         and device.get("kind") == "PERSONAL") or
        (actor.role == "enterprise" and device.get("enterprise_id") == actor.tenant_id
         and device.get("kind") == "MANAGED")
    )

def preflight(actor: DemoActor, device: dict[str, Any] | None,
              action: str, now: datetime | None = None) -> dict[str, Any]:
    """This is only a UI preflight, never authorizes a physical action."""
    now = now or datetime.now(timezone.utc)
    if action not in COMMANDS:
        return {"allowed": False, "code": "COMMAND_NOT_ALLOWLISTED"}
    if not owns(actor, device):
        return {"allowed": False, "code": "TARGET_NOT_AUTHORIZED"}
    policy = COMMANDS[action]
    if policy["plan"] == "personal" and actor.role != "owner":
        return {"allowed": False, "code": "ENTITLEMENT_MISSING"}
    snapshot = device.get("capabilities", {}).get(policy["capability"])
    if not snapshot or snapshot.get("state") != "SUPPORTED":
        return {"allowed": False, "code": "CAPABILITY_UNAVAILABLE"}
    try:
        checked_at = datetime.fromisoformat(snapshot["checked_at"].replace("Z", "+00:00"))
        age = abs((now - checked_at).total_seconds())
        if age > 60:
            return {"allowed": False, "code": "CAPABILITY_STALE"}
    except (ValueError, TypeError, KeyError):
        return {"allowed": False, "code": "CAPABILITY_UNKNOWN"}
    if device.get("connection") != "ONLINE":
        return {"allowed": False, "code": "DEVICE_OFFLINE"}
    return {"allowed": True, "code": "DEMO_PREFLIGHT_ONLY",
            "execution_enabled": False, "execution_recheck_required": True}

def prove_result(evidence: dict[str, Any] | None) -> str:
    """Arrival/acceptance is not proof; unsigned evidence remains unconfirmed."""
    if not evidence or evidence.get("verified") is not True:
        return RESULT_UNCONFIRMED
    required = ("source", "recorded_at", "artifact_hash")
    if any(not evidence.get(key) for key in required):
        return RESULT_UNCONFIRMED
    return "EVIDENCE_CONFIRMED"

def project_for_actor(actor: DemoActor, state: dict[str, Any]) -> dict[str, Any]:
    """Demo role response contains zero device telemetry for family/staff."""
    output = {"role": actor.role, "demo": True, "database": "NOT_CONNECTED",
              "devices": [], "incidents": [], "commands": [], "tickets": [],
              "family": None, "enterprise": None, "admin": None, "partner": None}
    if actor.role in ("owner", "enterprise"):
        output["devices"] = [d for d in state["devices"] if owns(actor, d)]
        wanted = "owner_id" if actor.role == "owner" else "enterprise_id"
        subject = actor.account_id if actor.role == "owner" else actor.tenant_id
        output["incidents"] = [i for i in state["incidents"] if i.get(wanted) == subject]
        output["commands"] = [c for c in state["commands"] if c.get("role") == actor.role]
    if actor.role == "owner":
        output["tickets"] = [t for t in state["tickets"] if t.get("owner_role") == actor.role]
    if actor.role == "family":
        output["family"] = state["family"]
        output["tickets"] = [t for t in state["tickets"] if t.get("owner_role") == actor.role]
    if actor.role == "enterprise":
        output["enterprise"] = state["enterprise"]
    if actor.role == "admin":
        output["admin"] = {"users": state["users"], "content": state["content"],
                           "audit": state["audit"]}
    if actor.role == "partner":
        output["partner"] = {"codes": [], "commission": "NOT_CONNECTED",
                             "payouts": "NOT_CONNECTED"}
    if actor.role == "support":
        output["tickets"] = [{k: t[k] for k in ("id", "subject", "status")}
                              for t in state["tickets"]]
    return output
