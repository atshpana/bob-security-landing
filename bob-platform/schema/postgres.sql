-- BOB Security - proposed PostgreSQL baseline, NOT applied to any database.
-- Data residency, retention, RLS, DSR and tenant isolation MUST be qualified
-- before production. All identifiers are server-assigned; never trust client role headers.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  status text NOT NULL CHECK(status IN ('PENDING','ACTIVE','SUSPENDED','DELETION_REQUESTED','DELETED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE identity_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  provider text NOT NULL,
  provider_subject text NOT NULL,
  verified_at timestamptz,
  UNIQUE(provider,provider_subject)
);
CREATE TABLE enterprises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  state text NOT NULL CHECK(state IN ('PENDING','ACTIVE','SUSPENDED','CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE enterprise_memberships (
  enterprise_id uuid NOT NULL REFERENCES enterprises(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  role text NOT NULL,
  status text NOT NULL,
  PRIMARY KEY(enterprise_id,account_id)
);
CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_account_id uuid REFERENCES accounts(id),
  enterprise_id uuid REFERENCES enterprises(id),
  kind text NOT NULL CHECK(kind IN ('PERSONAL','MANAGED')),
  platform text NOT NULL DEFAULT 'ANDROID',
  enrollment_state text NOT NULL,
  connectivity_state text NOT NULL DEFAULT 'UNKNOWN',
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind='PERSONAL' AND owner_account_id IS NOT NULL AND enterprise_id IS NULL)
    OR (kind='MANAGED' AND enterprise_id IS NOT NULL AND owner_account_id IS NULL))
);
CREATE INDEX devices_owner_idx ON devices(owner_account_id);
CREATE INDEX devices_enterprise_idx ON devices(enterprise_id);
CREATE TABLE device_capability_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id),
  capability_code text NOT NULL,
  state text NOT NULL CHECK(state IN ('SUPPORTED','UNSUPPORTED','DEGRADED','UNKNOWN')),
  checked_at timestamptz NOT NULL,
  source text NOT NULL,
  evidence_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX capability_latest_idx ON device_capability_snapshots(device_id,capability_code,checked_at DESC);
CREATE TABLE entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  enterprise_id uuid REFERENCES enterprises(id),
  plan_code text NOT NULL,
  state text NOT NULL CHECK(state IN ('PENDING','ACTIVE','PAUSED','EXPIRED','REVOKED')),
  valid_from timestamptz,
  valid_until timestamptz,
  provider_reference text,
  CHECK((account_id IS NOT NULL) <> (enterprise_id IS NOT NULL))
);
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  enterprise_id uuid REFERENCES enterprises(id),
  provider text NOT NULL,
  external_id text,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id),
  issued_at timestamptz,
  currency char(3) NOT NULL,
  total_minor bigint NOT NULL CHECK(total_minor>=0),
  status text NOT NULL,
  immutable_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_account_id uuid NOT NULL REFERENCES accounts(id),
  seat_limit integer NOT NULL CHECK(seat_limit>0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE family_memberships (
  family_id uuid NOT NULL REFERENCES family_groups(id),
  member_account_id uuid NOT NULL REFERENCES accounts(id),
  role text NOT NULL CHECK(role IN ('OWNER','MANAGER','ADULT')),
  state text NOT NULL,
  PRIMARY KEY(family_id,member_account_id)
);
CREATE TABLE family_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES family_groups(id),
  invited_email_encrypted bytea,
  state text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE managed_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id uuid NOT NULL REFERENCES enterprises(id),
  name text NOT NULL,
  version integer NOT NULL CHECK(version>0),
  state text NOT NULL CHECK(state IN ('DRAFT','REVIEW','APPROVED','RETIRED')),
  policy_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by uuid REFERENCES accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enterprise_id,name,version)
);
CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_account_id uuid REFERENCES accounts(id),
  enterprise_id uuid REFERENCES enterprises(id),
  target_device_id uuid REFERENCES devices(id),
  incident_type text NOT NULL,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  CHECK ((owner_account_id IS NOT NULL) <> (enterprise_id IS NOT NULL))
);
CREATE INDEX incidents_owner_idx ON incidents(owner_account_id,created_at DESC);
CREATE INDEX incidents_tenant_idx ON incidents(enterprise_id,created_at DESC);
CREATE TABLE commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id),
  device_id uuid NOT NULL REFERENCES devices(id),
  requested_by uuid NOT NULL REFERENCES accounts(id),
  command_type text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  state text NOT NULL CHECK(state IN ('REQUESTED','PREFLIGHT_REJECTED','ACCEPTED_BY_SERVER','DISPATCH_PENDING','DELIVERED','EXECUTING','RESULT_UNCONFIRMED','EVIDENCE_CONFIRMED','FAILED')),
  capability_snapshot_id uuid REFERENCES device_capability_snapshots(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE INDEX commands_device_idx ON commands(device_id,created_at DESC);
CREATE TABLE evidence_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id),
  source_device_id uuid REFERENCES devices(id),
  category text NOT NULL,
  stored_object_ref text NOT NULL,
  sha256_hex char(64) NOT NULL,
  collected_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  retention_until timestamptz,
  CHECK(sha256_hex ~ '^[0-9a-f]{64}$')
);
CREATE TABLE command_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id uuid NOT NULL REFERENCES commands(id),
  state text NOT NULL,
  source text NOT NULL,
  evidence_artifact_id uuid REFERENCES evidence_artifacts(id),
  received_at timestamptz NOT NULL DEFAULT now(),
  CHECK(state <> 'EVIDENCE_CONFIRMED' OR evidence_artifact_id IS NOT NULL)
);
CREATE TABLE issued_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id),
  report_number text NOT NULL UNIQUE,
  original_issued_at timestamptz NOT NULL,
  data_cutoff_at timestamptz NOT NULL,
  snapshot_hash char(64) NOT NULL,
  verification_id text NOT NULL UNIQUE,
  original_object_ref text NOT NULL,
  original_snapshot jsonb NOT NULL,
  signature_state text NOT NULL DEFAULT 'NOT_SIGNED'
);
CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id uuid REFERENCES accounts(id),
  enterprise_id uuid REFERENCES enterprises(id),
  action text NOT NULL,
  target_type text,
  target_id uuid,
  decision text NOT NULL,
  reason_code text NOT NULL,
  request_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  immutable_context jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX audit_actor_idx ON audit_events(actor_account_id,occurred_at DESC);
CREATE INDEX audit_tenant_idx ON audit_events(enterprise_id,occurred_at DESC);
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id),
  enterprise_id uuid REFERENCES enterprises(id),
  subject text NOT NULL,
  status text NOT NULL,
  assigned_team text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE partner_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_account_id uuid NOT NULL REFERENCES accounts(id),
  attribution_source text NOT NULL,
  qualifying_event_ref text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribution_id uuid NOT NULL REFERENCES partner_attributions(id),
  eligible_event_ref text NOT NULL UNIQUE,
  amount_minor bigint NOT NULL CHECK(amount_minor>=0),
  currency char(3) NOT NULL,
  state text NOT NULL CHECK(state IN ('PENDING_REVIEW','APPROVED','PAID','REVERSED')),
  approved_by uuid REFERENCES accounts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  locale text NOT NULL DEFAULT 'ar-EG',
  state text NOT NULL CHECK(state IN ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
  author_account_id uuid REFERENCES accounts(id),
  published_at timestamptz
);
COMMIT;
