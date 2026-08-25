CREATE TABLE IF NOT EXISTS email_tokens (id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, purpose TEXT NOT NULL CHECK (purpose IN ('verify_email','password_reset')), token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS email_tokens_lookup_idx ON email_tokens(token_hash, purpose, expires_at);

CREATE TABLE IF NOT EXISTS mfa_methods (user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, secret_encrypted TEXT NOT NULL, enabled BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), enabled_at TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS tenants (id UUID PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS tenant_memberships (tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK(role IN ('owner','school_admin','teacher','student')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,user_id));
ALTER TABLE curriculum_versions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS curriculum_tenant_idx ON curriculum_versions(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_events (id UUID PRIMARY KEY, provider TEXT NOT NULL, provider_event_id TEXT NOT NULL UNIQUE, event_type TEXT NOT NULL, payload JSONB NOT NULL, processed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS backups (id UUID PRIMARY KEY, object_key TEXT NOT NULL, checksum TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
