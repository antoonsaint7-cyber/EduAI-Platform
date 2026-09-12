ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_tenant_course
  ON documents(tenant_id, course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_lesson
  ON documents(tenant_id, lesson_id, created_at DESC);
