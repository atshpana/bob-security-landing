"""Pre-DB persistence boundary; must fail closed until MySQL/Redis are connected.

Future adapters must implement atomic transactions, idempotency, audit, tenant
queries and cancellation; intentionally no SQLite/PostgreSQL fallback.
"""
from dataclasses import dataclass
from typing import Protocol, Any
class DatabaseNotConnected(RuntimeError):
    pass
@dataclass(frozen=True)
class RequestScope:
    account_id: str
    tenant_id: str | None
    role: str
    reauthenticated: bool = False
class BobRepository(Protocol):
    async def read_device(self, scope: RequestScope, device_id: str) -> dict[str, Any]: ...
    async def add_command_atomic(self, scope: RequestScope, command: dict[str, Any]) -> str: ...
    async def create_deletion_request(self, scope: RequestScope) -> str: ...
class UnconnectedRepository:
    def __getattr__(self,name):
        raise DatabaseNotConnected("MySQL / Redis NOT_CONNECTED: " + name)
    async def read_device(self, scope, device_id):
        raise DatabaseNotConnected("MySQL NOT_CONNECTED")
    async def add_command_atomic(self, scope, command):
        raise DatabaseNotConnected("MySQL NOT_CONNECTED")
    async def create_deletion_request(self, scope):
        raise DatabaseNotConnected("MySQL NOT_CONNECTED")
