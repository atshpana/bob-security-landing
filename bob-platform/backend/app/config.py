"""BOB 4.0 pre-DB contract settings. No production settings are inferred."""
from dataclasses import dataclass
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"

@dataclass(frozen=True)
class Settings:
    mode: str = "DEMO"
    mysql_connected: bool = False
    redis_connected: bool = False
    authentication_enabled: bool = False
    real_device_execution: bool = False
    amapi_enabled: bool = False
    play_billing_enabled: bool = False
    official_reports_enabled: bool = False

    @classmethod
    def load(cls):
        if os.environ.get("BOB_DEMO_ONLY", "0") != "1":
            raise RuntimeError("BOB_DEMO_ONLY=1 required. Refuse to expose an unauthenticated demo as production.")
        return cls()
