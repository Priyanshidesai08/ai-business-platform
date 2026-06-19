import { execute, fetchAll, fetchOne } from '../../shared/db.js';

const ensureMonitoringSchema = async () => {
  await execute(`
    CREATE TABLE IF NOT EXISTS metrics (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      metric_key VARCHAR(120) NOT NULL,
      metric_value NUMERIC(18, 4) NOT NULL DEFAULT 0,
      dimension JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS monitoring_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      source VARCHAR(80) NOT NULL,
      event_type VARCHAR(120) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'info',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS feedback (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      source VARCHAR(80) NOT NULL,
      rating INT NOT NULL DEFAULT 5,
      comments TEXT,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await execute('CREATE INDEX IF NOT EXISTS idx_metrics_user_created ON metrics(user_id, created_at DESC)');
  await execute('CREATE INDEX IF NOT EXISTS idx_monitoring_events_user_created ON monitoring_events(user_id, created_at DESC)');
  await execute('CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON feedback(user_id, created_at DESC)');
};

const calcLatency = (runs = []) => {
  const durations = runs
    .map((run) => {
      if (!run.started_at || !run.completed_at) return 0;
      return Math.max(0, new Date(run.completed_at).getTime() - new Date(run.started_at).getTime());
    })
    .filter(Boolean);
  if (!durations.length) return 0;
  return Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(2));
};

const asJson = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

export const buildMonitoringDashboard = async (userId) => {
  await ensureMonitoringSchema();
  const [activityLogs, runs, steps, aiGenerations, events, feedbackRows] = await Promise.all([
    fetchAll('SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25', [userId]),
    fetchAll('SELECT * FROM orchestration_runs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
    fetchAll('SELECT * FROM orchestration_steps WHERE run_id IN (SELECT id FROM orchestration_runs WHERE user_id = $1) ORDER BY created_at DESC LIMIT 100', [userId]),
    fetchAll('SELECT * FROM ai_generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
    fetchAll('SELECT * FROM monitoring_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25', [userId]),
    fetchAll('SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25', [userId])
  ]);

  const healthyRuns = runs.filter((run) => run.status === 'completed').length;
  const failedRuns = runs.filter((run) => run.status === 'failed').length;
  const apiUsage = aiGenerations.length;
  const avgLatencyMs = calcLatency(runs);
  const stepLatencyByAgent = steps.reduce((acc, step) => {
    const latencyMs = step.started_at && step.completed_at
      ? Math.max(0, new Date(step.completed_at).getTime() - new Date(step.started_at).getTime())
      : 0;
    if (!acc[step.agent]) {
      acc[step.agent] = { agent: step.agent, count: 0, avgLatencyMs: 0, avgConfidence: 0 };
    }
    acc[step.agent].count += 1;
    acc[step.agent].avgLatencyMs = Number((((acc[step.agent].avgLatencyMs * (acc[step.agent].count - 1)) + latencyMs) / acc[step.agent].count).toFixed(2));
    acc[step.agent].avgConfidence = Number((((acc[step.agent].avgConfidence * (acc[step.agent].count - 1)) + Number(step.confidence || 0)) / acc[step.agent].count).toFixed(2));
    return acc;
  }, {});

  const feedbackSummary = feedbackRows.reduce((acc, item) => {
    const rating = Math.max(1, Math.min(5, Number(item.rating || 5)));
    acc.total += 1;
    acc.average = Number((((acc.average * (acc.total - 1)) + rating) / acc.total).toFixed(2));
    return acc;
  }, { total: 0, average: 0 });

  return {
    kpis: {
      uptime: 99.92,
      systemStatus: failedRuns > healthyRuns ? 'Degraded' : 'Healthy',
      apiUsage,
      requestTracking: activityLogs.length,
      avgLatencyMs,
      executionDurationMs: Number((runs.reduce((sum, run) => sum + (run.started_at && run.completed_at ? Math.max(0, new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) : 0), 0) / Math.max(runs.length, 1)).toFixed(2)),
      successRate: runs.length ? Number(((healthyRuns / runs.length) * 100).toFixed(2)) : 0,
      errorRate: runs.length ? Number(((failedRuns / runs.length) * 100).toFixed(2)) : 0
    },
    roi: {
      generatedValue: Number((healthyRuns * 1200 + apiUsage * 35).toFixed(2)),
      costSaved: Number((healthyRuns * 480 + apiUsage * 18).toFixed(2)),
      efficiencyGain: runs.length ? Number(((healthyRuns / Math.max(runs.length, 1)) * 100).toFixed(2)) : 0
    },
    productivity: Object.values(stepLatencyByAgent).sort((a, b) => b.count - a.count),
    workflowMetrics: {
      totalRuns: runs.length,
      healthyRuns,
      failedRuns,
      avgLatencyMs,
      recentExecutions: runs.slice(0, 8).map((run) => ({
        id: run.id,
        status: run.status,
        confidence: Number(run.confidence || 0),
        startedAt: run.started_at,
        completedAt: run.completed_at,
        durationMs: run.started_at && run.completed_at ? Math.max(0, new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) : 0,
        selectedAgents: asJson(run.selected_agents, [])
      }))
    },
    systemStatus: {
      logs: activityLogs.slice(0, 8),
      events: events.slice(0, 8),
      feedback: feedbackRows.slice(0, 8),
      feedbackSummary
    }
  };
};

export const recordMonitoringEvent = async (userId, payload) => {
  await ensureMonitoringSchema();
  return fetchOne(
    `INSERT INTO monitoring_events (user_id, source, event_type, status, payload)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      payload.source || 'system',
      payload.eventType || 'event',
      payload.status || 'info',
      JSON.stringify(payload.payload || {})
    ]
  );
};

export const addFeedback = async (userId, payload) => {
  await ensureMonitoringSchema();
  return fetchOne(
    `INSERT INTO feedback (user_id, source, rating, comments, tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      payload.source || 'workspace',
      Math.max(1, Math.min(5, Number(payload.rating || 5))),
      payload.comments || '',
      JSON.stringify(payload.tags || [])
    ]
  );
};

export const logMetric = async (userId, payload) => {
  await ensureMonitoringSchema();
  return fetchOne(
    `INSERT INTO metrics (user_id, metric_key, metric_value, dimension)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      userId,
      payload.metricKey,
      Number(payload.metricValue || 0),
      JSON.stringify(payload.dimension || {})
    ]
  );
};

export const listMetrics = async (userId) => {
  await ensureMonitoringSchema();
  return fetchAll('SELECT * FROM metrics WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
};

export const listEvents = async (userId) => {
  await ensureMonitoringSchema();
  return fetchAll('SELECT * FROM monitoring_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
};

export const listFeedback = async (userId) => {
  await ensureMonitoringSchema();
  return fetchAll('SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
};
