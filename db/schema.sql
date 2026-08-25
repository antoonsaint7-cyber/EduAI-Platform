CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','teacher','admin')),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS curriculum_versions (
  id UUID PRIMARY KEY, curriculum_id UUID NOT NULL, source_version TEXT NOT NULL, title TEXT NOT NULL, subject TEXT NOT NULL, grade TEXT NOT NULL,
  country TEXT, term TEXT, academic_year TEXT, language TEXT DEFAULT 'ar', source_type TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft','processing','evaluating','awaiting-review','published','needs-review','failed')),
  source_name TEXT, source_hash TEXT, source_file_id TEXT, vector_store_id TEXT, curriculum JSONB NOT NULL DEFAULT '{}'::jsonb, evaluation JSONB,
  approved_by UUID REFERENCES users(id), published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS curriculum_versions_curriculum_idx ON curriculum_versions(curriculum_id, created_at DESC);
CREATE INDEX IF NOT EXISTS curriculum_versions_status_idx ON curriculum_versions(status);
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY, type TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('queued','processing','completed','failed')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, result JSONB, error TEXT, attempts INTEGER NOT NULL DEFAULT 0, available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ, locked_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_queue_idx ON jobs(status, available_at);
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY, action TEXT NOT NULL, actor_id UUID REFERENCES users(id), actor_role TEXT,
  curriculum_version_id UUID REFERENCES curriculum_versions(id), metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_version_idx ON audit_events(curriculum_version_id, created_at DESC);
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY, student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, curriculum_id UUID NOT NULL, lesson_id TEXT NOT NULL,
  mastery NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 1), attempts INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ, UNIQUE(student_id, curriculum_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY, student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, curriculum_id UUID NOT NULL, lesson_id TEXT, concept TEXT,
  event_type TEXT NOT NULL, correct BOOLEAN, difficulty TEXT, response_ms INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learning_events_student_idx ON learning_events(student_id, created_at DESC);
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY, curriculum_id UUID NOT NULL, version_id UUID REFERENCES curriculum_versions(id), title TEXT NOT NULL, config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft', created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY, assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE, student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]', score NUMERIC(6,3), started_at TIMESTAMPTZ NOT NULL DEFAULT now(), submitted_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, plan TEXT NOT NULL, status TEXT NOT NULL,
  provider TEXT, provider_customer_id TEXT, provider_subscription_id TEXT, current_period_end TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, period_start DATE NOT NULL, messages INTEGER NOT NULL DEFAULT 0,
  generation_jobs INTEGER NOT NULL DEFAULT 0, voice_seconds INTEGER NOT NULL DEFAULT 0, storage_bytes BIGINT NOT NULL DEFAULT 0,
  UNIQUE(user_id, period_start)
);
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
  read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS idempotency_keys (key TEXT PRIMARY KEY, user_id UUID REFERENCES users(id), response JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
