-- EduAI V2: Adaptive Learning + grounded retrieval + advanced exam metadata.
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  source_title TEXT NOT NULL,
  page INTEGER,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, document_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS knowledge_chunks_tenant_doc_idx ON knowledge_chunks(tenant_id, document_id);

CREATE TABLE IF NOT EXISTS skill_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  mastery NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (mastery BETWEEN 0 AND 100),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, skill)
);
CREATE INDEX IF NOT EXISTS skill_mastery_student_idx ON skill_mastery(tenant_id, student_id, mastery);

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'EduAI Assessment';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER NOT NULL DEFAULT 30 CHECK (time_limit_minutes BETWEEN 1 AND 240);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

DROP TRIGGER IF EXISTS skill_mastery_updated_at ON skill_mastery;
CREATE TRIGGER skill_mastery_updated_at BEFORE UPDATE ON skill_mastery FOR EACH ROW EXECUTE FUNCTION set_updated_at();
