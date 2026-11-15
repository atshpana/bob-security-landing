"""BOB public API contract models: no direct database objects are exposed."""
from pydantic import BaseModel, ConfigDict, Field

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

class CommandRequest(StrictModel):
    device_id: str = Field(min_length=1, max_length=128)
    action: str = Field(min_length=2, max_length=64)

class IncidentDraft(StrictModel):
    subject: str = Field(min_length=4, max_length=120)

class TicketDraft(StrictModel):
    subject: str = Field(min_length=5, max_length=160)

class PolicyDraft(StrictModel):
    name: str = Field(min_length=3, max_length=100)

class ReportPreviewRequest(StrictModel):
    incident_id: str = Field(min_length=3, max_length=128)

class AccountDeletionRequest(StrictModel):
    acknowledge: bool
