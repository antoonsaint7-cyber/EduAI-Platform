-- EduAI: durable assessment evidence for topic-level mastery.
CREATE TABLE IF NOT EXISTS assessment_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  difficulty NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (difficulty BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessment_evidence_student_topic_idx
  ON assessment_evidence(tenant_id, student_id, subject, topic, created_at DESC);

CREATE INDEX IF NOT EXISTS assessment_evidence_assessment_idx
  ON assessment_evidence(tenant_id, assessment_id);
