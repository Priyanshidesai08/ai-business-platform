ALTER TABLE orchestration_steps
ADD COLUMN IF NOT EXISTS phase_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;
