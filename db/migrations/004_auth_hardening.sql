CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('email_verification','password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_tokens_user_purpose_idx ON auth_tokens(user_id, purpose);
CREATE INDEX IF NOT EXISTS auth_tokens_expiry_idx ON auth_tokens(expires_at);

CREATE TABLE IF NOT EXISTS user_mfa (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL,
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, code_hash)
);
CREATE INDEX IF NOT EXISTS mfa_recovery_codes_user_idx ON mfa_recovery_codes(user_id);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
