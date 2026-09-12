CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS courses_tenant_status_idx ON courses(tenant_id,status,updated_at DESC);

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0);
CREATE INDEX IF NOT EXISTS lessons_course_idx ON lessons(course_id,position,updated_at DESC);

CREATE TABLE IF NOT EXISTS course_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id,student_id)
);
CREATE INDEX IF NOT EXISTS course_memberships_student_idx ON course_memberships(tenant_id,student_id,status);
CREATE INDEX IF NOT EXISTS course_memberships_course_idx ON course_memberships(tenant_id,course_id,status);

DROP TRIGGER IF EXISTS courses_updated_at ON courses;
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
