-- BOB NEW relational schema; apply only after database selection and review.
CREATE TABLE organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL);
CREATE TABLE users (id TEXT PRIMARY KEY, organization_id TEXT REFERENCES organizations(id), email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE devices (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), organization_id TEXT REFERENCES organizations(id), label TEXT NOT NULL, ownership_verified INTEGER NOT NULL DEFAULT 0, enrolled_at TEXT, last_seen_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE consents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), device_id TEXT REFERENCES devices(id), purpose TEXT NOT NULL, granted INTEGER NOT NULL, recorded_at TEXT NOT NULL);
CREATE TABLE commands (id TEXT PRIMARY KEY, device_id TEXT NOT NULL REFERENCES devices(id), requested_by TEXT NOT NULL REFERENCES users(id), command_type TEXT NOT NULL, status TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, completed_at TEXT);
CREATE TABLE tickets (id TEXT PRIMARY KEY, organization_id TEXT REFERENCES organizations(id), opened_by TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE audit_events (id TEXT PRIMARY KEY, actor_id TEXT REFERENCES users(id), action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT, occurred_at TEXT NOT NULL, metadata_json TEXT);
CREATE INDEX idx_devices_owner ON devices(owner_id);
CREATE INDEX idx_commands_device ON commands(device_id,created_at);
CREATE INDEX idx_audit_target ON audit_events(target_type,target_id);
