CREATE TABLE IF NOT EXISTS orchestration_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request TEXT NOT NULL,
  selected_agents JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(30) NOT NULL DEFAULT 'running',
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  shared_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orchestration_runs_user_id ON orchestration_runs(user_id);

CREATE TABLE IF NOT EXISTS orchestration_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES orchestration_runs(id) ON DELETE CASCADE,
  agent VARCHAR(80) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'completed',
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orchestration_steps_run_id ON orchestration_steps(run_id);
