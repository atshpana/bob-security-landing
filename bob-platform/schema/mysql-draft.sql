-- BOB 4.0 / MySQL 8+ DRAFT — NOT EXECUTED, NOT CONNECTED
-- Derived from §§3, 9, 11, 12, 14, 15, 16, 22, 29.
-- This is NOT an approved migration. Require G0 review, DSR/retention policy,
-- encrypted storage, app-enforced tenant isolation, restore tests, and secrets
-- management before executing. MySQL does NOT provide PostgreSQL-style RLS.
-- Never connect a browser or Flutter app directly to this database.
CREATE TABLE IF NOT EXISTS accounts (
 id CHAR(36) PRIMARY KEY,
 display_name VARCHAR(200) NOT NULL,
 state ENUM('PENDING','ACTIVE','SUSPENDED','DELETION_REQUESTED','DELETED') NOT NULL,
 created_at DATETIME(6) NOT NULL,
 INDEX idx_account_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS identity_subjects (
 id CHAR(36) PRIMARY KEY, account_id CHAR(36) NOT NULL,
 provider VARCHAR(64) NOT NULL, external_subject VARCHAR(255) NOT NULL,
 verified_at DATETIME(6), UNIQUE KEY uniq_subject (provider,external_subject),
 CONSTRAINT fk_identity_account FOREIGN KEY(account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS enterprises (
 id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL,
 status ENUM('PENDING','ACTIVE','SUSPENDED','CLOSED') NOT NULL,
 created_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS enterprise_memberships (
 enterprise_id CHAR(36) NOT NULL, account_id CHAR(36) NOT NULL,
 role VARCHAR(64) NOT NULL, state VARCHAR(40) NOT NULL,
 PRIMARY KEY(enterprise_id,account_id),
 FOREIGN KEY(enterprise_id) REFERENCES enterprises(id),
 FOREIGN KEY(account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS unified_devices (
 id CHAR(36) PRIMARY KEY, owner_account_id CHAR(36),
 enterprise_id CHAR(36), provider VARCHAR(80) NOT NULL DEFAULT 'ANDROID',
 management_kind ENUM('PERSONAL','MANAGED') NOT NULL,
 enrollment_state VARCHAR(80) NOT NULL,
 connectivity_state VARCHAR(80) NOT NULL,
 last_seen_at DATETIME(6), created_at DATETIME(6) NOT NULL,
 CONSTRAINT ck_device_scope CHECK(
 (management_kind='PERSONAL' AND owner_account_id IS NOT NULL AND enterprise_id IS NULL)
 OR (management_kind='MANAGED' AND owner_account_id IS NULL AND enterprise_id IS NOT NULL)),
 FOREIGN KEY(owner_account_id) REFERENCES accounts(id),
 FOREIGN KEY(enterprise_id) REFERENCES enterprises(id),
 INDEX idx_device_owner (owner_account_id), INDEX idx_device_tenant (enterprise_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS provider_bindings (
 id CHAR(36) PRIMARY KEY, device_id CHAR(36) NOT NULL,
 provider VARCHAR(80) NOT NULL, provider_device_ref VARCHAR(255) NOT NULL,
 provider_schema_version INT NOT NULL, state VARCHAR(50) NOT NULL,
 UNIQUE KEY uniq_provider_binding (provider,provider_device_ref),
 FOREIGN KEY(device_id) REFERENCES unified_devices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS device_capability_snapshots (
 id CHAR(36) PRIMARY KEY, device_id CHAR(36) NOT NULL,
 capability_code VARCHAR(80) NOT NULL, capability_state VARCHAR(80) NOT NULL,
 checked_at DATETIME(6) NOT NULL, source VARCHAR(120) NOT NULL,
 policy_version VARCHAR(80), evidence_digest CHAR(64),
 FOREIGN KEY(device_id) REFERENCES unified_devices(id),
 INDEX idx_probe_latest (device_id,capability_code,checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS entitlements (
 id CHAR(36) PRIMARY KEY, account_id CHAR(36), enterprise_id CHAR(36),
 plan_code VARCHAR(80) NOT NULL,
 state ENUM('PENDING','ACTIVE','PAUSED','EXPIRED','REVOKED') NOT NULL,
 valid_from DATETIME(6), valid_until DATETIME(6), provider_ref VARCHAR(255),
 CHECK ((account_id IS NULL) <> (enterprise_id IS NULL)),
 FOREIGN KEY(account_id) REFERENCES accounts(id),
 FOREIGN KEY(enterprise_id) REFERENCES enterprises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS purchase_events (
 id CHAR(36) PRIMARY KEY, account_id CHAR(36) NOT NULL,
 provider VARCHAR(70) NOT NULL, external_event_id VARCHAR(255) NOT NULL,
 event_state VARCHAR(100) NOT NULL, event_at DATETIME(6) NOT NULL,
 UNIQUE KEY uniq_external_purchase (provider,external_event_id),
 FOREIGN KEY(account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS invoices (
 id CHAR(36) PRIMARY KEY, account_id CHAR(36), enterprise_id CHAR(36),
 invoice_number VARCHAR(80) UNIQUE, amount_minor BIGINT NOT NULL,
 currency CHAR(3) NOT NULL, state VARCHAR(60) NOT NULL, created_at DATETIME(6) NOT NULL,
 CHECK(amount_minor >= 0), FOREIGN KEY(account_id) REFERENCES accounts(id),
 FOREIGN KEY(enterprise_id) REFERENCES enterprises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS family_groups (
 id CHAR(36) PRIMARY KEY, payer_account_id CHAR(36) NOT NULL,
 seat_limit INT NOT NULL, state VARCHAR(60) NOT NULL,
 CHECK(seat_limit>0), FOREIGN KEY(payer_account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS family_memberships (
 family_id CHAR(36) NOT NULL, account_id CHAR(36) NOT NULL,
 role ENUM('PAYER','MANAGER','ADULT') NOT NULL,
 state VARCHAR(60) NOT NULL, age_rule_version VARCHAR(80),
 PRIMARY KEY(family_id,account_id),
 FOREIGN KEY(family_id) REFERENCES family_groups(id),
 FOREIGN KEY(account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- No relationship in family_memberships permits observing a second adult's device.
CREATE TABLE IF NOT EXISTS managed_policy_versions (
 id CHAR(36) PRIMARY KEY, enterprise_id CHAR(36) NOT NULL,
 policy_code VARCHAR(80) NOT NULL, version INT NOT NULL,
 state ENUM('DRAFT','REVIEW','APPROVED','RETIRED') NOT NULL,
 spec JSON NOT NULL, approved_by CHAR(36),
 UNIQUE KEY uniq_policy_version (enterprise_id,policy_code,version),
 FOREIGN KEY(enterprise_id) REFERENCES enterprises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS incidents (
 id CHAR(36) PRIMARY KEY, owner_account_id CHAR(36), enterprise_id CHAR(36),
 target_device_id CHAR(36), state VARCHAR(60) NOT NULL,
 type VARCHAR(80) NOT NULL, created_at DATETIME(6) NOT NULL,
 CHECK ((owner_account_id IS NULL) <> (enterprise_id IS NULL)),
 FOREIGN KEY(owner_account_id) REFERENCES accounts(id),
 FOREIGN KEY(enterprise_id) REFERENCES enterprises(id),
 FOREIGN KEY(target_device_id) REFERENCES unified_devices(id),
 INDEX idx_inc_owner (owner_account_id,created_at),
 INDEX idx_inc_tenant (enterprise_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS commands (
 id CHAR(36) PRIMARY KEY, device_id CHAR(36) NOT NULL,
 incident_id CHAR(36), requested_by CHAR(36) NOT NULL,
 type VARCHAR(90) NOT NULL, state VARCHAR(80) NOT NULL,
 idempotency_key VARCHAR(255) NOT NULL UNIQUE,
 expires_at DATETIME(6), requested_at DATETIME(6) NOT NULL,
 capability_snapshot_id CHAR(36),
 FOREIGN KEY(device_id) REFERENCES unified_devices(id),
 FOREIGN KEY(incident_id) REFERENCES incidents(id),
 FOREIGN KEY(requested_by) REFERENCES accounts(id),
 FOREIGN KEY(capability_snapshot_id) REFERENCES device_capability_snapshots(id),
 INDEX idx_device_command (device_id,requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS evidence_artifacts (
 id CHAR(36) PRIMARY KEY, incident_id CHAR(36) NOT NULL,
 source_device_id CHAR(36), stored_object_ref VARCHAR(500) NOT NULL,
 sha256_hex CHAR(64) NOT NULL, captured_at DATETIME(6),
 received_at DATETIME(6) NOT NULL, verified_at DATETIME(6),
 retention_until DATETIME(6), CHECK(sha256_hex REGEXP '^[0-9a-f]{64}$'),
 FOREIGN KEY(incident_id) REFERENCES incidents(id),
 FOREIGN KEY(source_device_id) REFERENCES unified_devices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS command_results (
 id CHAR(36) PRIMARY KEY, command_id CHAR(36) NOT NULL,
 state VARCHAR(80) NOT NULL, recorded_at DATETIME(6) NOT NULL,
 evidence_artifact_id CHAR(36), source VARCHAR(120) NOT NULL,
 CHECK(state <> 'EVIDENCE_CONFIRMED' OR evidence_artifact_id IS NOT NULL),
 FOREIGN KEY(command_id) REFERENCES commands(id),
 FOREIGN KEY(evidence_artifact_id) REFERENCES evidence_artifacts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS issued_reports (
 id CHAR(36) PRIMARY KEY, incident_id CHAR(36) NOT NULL,
 report_number VARCHAR(120) NOT NULL UNIQUE,
 original_issued_at DATETIME(6) NOT NULL, data_cutoff_at DATETIME(6) NOT NULL,
 original_snapshot JSON NOT NULL, original_hash CHAR(64) NOT NULL,
 verification_id VARCHAR(120) NOT NULL UNIQUE,
 signature_state VARCHAR(60) NOT NULL,
 FOREIGN KEY(incident_id) REFERENCES incidents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS audit_events (
 id CHAR(36) PRIMARY KEY, actor_id CHAR(36), enterprise_id CHAR(36),
 action VARCHAR(100) NOT NULL, target_type VARCHAR(80), target_ref VARCHAR(120),
 reason_code VARCHAR(100) NOT NULL, decision VARCHAR(80) NOT NULL,
 context_minimized JSON, occurred_at DATETIME(6) NOT NULL,
 INDEX idx_audit_actor (actor_id,occurred_at),
 INDEX idx_audit_tenant (enterprise_id,occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS support_tickets (
 id CHAR(36) PRIMARY KEY, account_id CHAR(36), enterprise_id CHAR(36),
 subject VARCHAR(160) NOT NULL, state VARCHAR(60) NOT NULL,
 assigned_team VARCHAR(80), created_at DATETIME(6) NOT NULL,
 FOREIGN KEY(account_id) REFERENCES accounts(id),
 FOREIGN KEY(enterprise_id) REFERENCES enterprises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS partner_attributions (
 id CHAR(36) PRIMARY KEY, partner_account_id CHAR(36) NOT NULL,
 source_code VARCHAR(255) NOT NULL, qualifying_event_ref VARCHAR(255),
 verified_at DATETIME(6), FOREIGN KEY(partner_account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS commission_ledger (
 id CHAR(36) PRIMARY KEY, attribution_id CHAR(36) NOT NULL,
 eligible_event_ref VARCHAR(255) NOT NULL UNIQUE,
 amount_minor BIGINT NOT NULL, currency CHAR(3) NOT NULL,
 state ENUM('PENDING_REVIEW','APPROVED','PAID','REVERSED') NOT NULL,
 approved_by CHAR(36), CHECK(amount_minor>=0),
 FOREIGN KEY(attribution_id) REFERENCES partner_attributions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS content_items (
 id CHAR(36) PRIMARY KEY, author_id CHAR(36), title VARCHAR(255) NOT NULL,
 body TEXT, locale VARCHAR(20) NOT NULL DEFAULT 'ar-EG',
 state ENUM('DRAFT','REVIEW','PUBLISHED','ARCHIVED') NOT NULL,
 published_at DATETIME(6), FOREIGN KEY(author_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
