CREATE TABLE IF NOT EXISTS insights_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  horizon VARCHAR(30) NOT NULL DEFAULT '30d',
  confidence NUMERIC(5, 2) NOT NULL DEFAULT 0,
  forecast JSONB NOT NULL DEFAULT '{}'::jsonb,
  trend_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  anomaly_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_predictions_user_id ON insights_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_predictions_created_at ON insights_predictions(created_at DESC);

