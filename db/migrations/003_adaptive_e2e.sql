-- EduAI V2: persist the evidence needed for end-to-end adaptive assessment flows.
ALTER TABLE skill_mastery
  ADD COLUMN IF NOT EXISTS last_score NUMERIC(5,2) CHECK (last_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS last_difficulty NUMERIC(5,2) CHECK (last_difficulty BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS last_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS skill_mastery_student_updated_idx
  ON skill_mastery(student_id, updated_at DESC);
