-- Durable assessment attempt history for analytics, review and future reporting.
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions >= 0),
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessment_attempts_student_idx
  ON assessment_attempts(tenant_id, student_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS assessment_attempts_assessment_idx
  ON assessment_attempts(tenant_id, assessment_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS assessment_attempts_lesson_idx
  ON assessment_attempts(tenant_id, lesson_id, submitted_at DESC);
