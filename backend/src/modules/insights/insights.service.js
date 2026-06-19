import { fetchAll, fetchOne, execute } from '../../shared/db.js';

const ensureInsightsSchema = async () => {
  await execute(`
    CREATE TABLE IF NOT EXISTS insights_predictions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      horizon VARCHAR(30) NOT NULL DEFAULT '30d',
      confidence NUMERIC(5, 2) NOT NULL DEFAULT 0,
      forecast JSONB NOT NULL DEFAULT '{}'::jsonb,
      trend_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
      anomaly_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await execute('CREATE INDEX IF NOT EXISTS idx_insights_predictions_user_id ON insights_predictions(user_id)');
  await execute('CREATE INDEX IF NOT EXISTS idx_insights_predictions_created_at ON insights_predictions(created_at DESC)');
};

const buildEfficiency = (workflowRuns = [], leads = [], campaigns = [], tickets = []) => {
  const successRuns = workflowRuns.filter((run) => run.status === 'success').length;
  const runCount = workflowRuns.length || 1;
  const leadCount = leads.length || 1;
  const resolvedTickets = tickets.filter((ticket) => ['resolved', 'closed'].includes(ticket.status)).length;
  const conversion = leads.filter((lead) => lead.category === 'Hot').length / leadCount;
  return {
    workflowEfficiency: Number(((successRuns / runCount) * 100).toFixed(2)),
    leadConversion: Number((conversion * 100).toFixed(2)),
    campaignSuccess: campaigns.length ? Number(((campaigns.filter((campaign) => campaign.status === 'active').length / campaigns.length) * 100).toFixed(2)) : 0,
    supportResolution: tickets.length ? Number(((resolvedTickets / tickets.length) * 100).toFixed(2)) : 0
  };
};

export const buildInsights = async (userId) => {
  await ensureInsightsSchema();
  const [leads, campaigns, tickets, workflowRuns, logs] = await Promise.all([
    fetchAll('SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    fetchAll('SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    fetchAll('SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    fetchAll('SELECT * FROM workflow_runs WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    fetchAll('SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25', [userId])
  ]);

  const metrics = buildEfficiency(workflowRuns, leads, campaigns, tickets);
  const trend = workflowRuns.slice(0, 5).map((run, index) => ({
    label: `Run ${index + 1}`,
    status: run.status,
    duration: run.completed_at && run.started_at ? Math.max(1, Math.round((new Date(run.completed_at) - new Date(run.started_at)) / 1000)) : 0,
    currentStep: run.current_step || 0
  }));

  const recommendations = [];
  if (metrics.leadConversion < 50) recommendations.push('Tighten lead qualification with higher intent thresholds.');
  if (metrics.campaignSuccess < 60) recommendations.push('Review campaign quality and target segmentation.');
  if (metrics.supportResolution < 70) recommendations.push('Reduce open ticket aging with faster escalation.');
  if (metrics.workflowEfficiency < 70) recommendations.push('Simplify workflow branches with clearer execution gates.');

  return {
    metrics,
    trend,
    recommendations,
    recentActivity: logs
  };
};

export const predictInsights = async (userId, payload = {}) => {
  await ensureInsightsSchema();
  const insights = await buildInsights(userId);
  const horizon = payload.horizon || '30d';
  const confidence = Math.min(0.98, Math.max(0.55, (insights.metrics.workflowEfficiency + insights.metrics.leadConversion + insights.metrics.supportResolution) / 300));
  const forecast = {
    horizon,
    predictedLeadConversion: Number((insights.metrics.leadConversion * 1.08).toFixed(2)),
    predictedCampaignSuccess: Number((insights.metrics.campaignSuccess * 1.05).toFixed(2)),
    predictedSupportResolution: Number((insights.metrics.supportResolution * 1.03).toFixed(2)),
    predictedWorkflowEfficiency: Number((insights.metrics.workflowEfficiency * 1.04).toFixed(2))
  };

  const anomalySignals = [];
  if (insights.metrics.workflowEfficiency < 40) anomalySignals.push('Workflow efficiency is unusually low.');
  if (insights.metrics.leadConversion < 20) anomalySignals.push('Lead conversion is below baseline.');
  if (!insights.recentActivity.length) anomalySignals.push('No recent activity found for this workspace.');

  const prediction = await fetchOne(
    `INSERT INTO insights_predictions (user_id, horizon, confidence, forecast, trend_summary, anomaly_signals, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [
      userId,
      horizon,
      confidence,
      JSON.stringify(forecast),
      JSON.stringify(insights.trend),
      JSON.stringify(anomalySignals)
    ]
  );

  return {
    prediction,
    confidence,
    forecast,
    anomalies: anomalySignals,
    recommendations: insights.recommendations
  };
};

export const getTrends = async (userId) => {
  await ensureInsightsSchema();
  const rows = await fetchAll(
    `SELECT * FROM insights_predictions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );
  return rows.map((row) => ({
    ...row,
    forecast: typeof row.forecast === 'string' ? JSON.parse(row.forecast) : row.forecast,
    trend_summary: typeof row.trend_summary === 'string' ? JSON.parse(row.trend_summary) : row.trend_summary,
    anomaly_signals: typeof row.anomaly_signals === 'string' ? JSON.parse(row.anomaly_signals) : row.anomaly_signals
  }));
};
