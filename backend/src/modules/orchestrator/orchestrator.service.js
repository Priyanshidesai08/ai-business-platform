import { ApiError } from '../../utils/apiError.js';
import { fetchAll, fetchOne, execute } from '../../shared/db.js';
import { createLeadService, scoreLeadService } from '../sales-agent/sales.service.js';
import { generateCampaign } from '../marketing-agent/marketing.service.js';
import { buildReport } from '../analytics-agent/analytics.service.js';
import { chatSupport, createTicket } from '../support-agent/support.service.js';
import { generateAiResponse } from '../ai/ai.service.js';
import { templates } from '../ai/prompt-templates.js';

const agentCatalog = {
  sales: {
    name: 'Sales',
    keywords: ['lead', 'customer', 'account', 'pipeline', 'budget', 'qualification'],
    priority: 3
  },
  marketing: {
    name: 'Marketing',
    keywords: ['campaign', 'launch', 'email', 'content', 'ad', 'audience'],
    priority: 2
  },
  analytics: {
    name: 'Analytics',
    keywords: ['report', 'conversion', 'metric', 'trend', 'performance', 'dashboard'],
    priority: 1
  },
  support: {
    name: 'Support',
    keywords: ['support', 'ticket', 'issue', 'help', 'resolve', 'incident', 'customer service'],
    priority: 2
  }
};

const safeJson = (value, fallback = {}) => {
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

export const decideAgents = (request) => {
  const text = `${request?.request || ''} ${request?.goal || ''} ${request?.context?.industry || ''}`.toLowerCase();
  const scored = Object.entries(agentCatalog).map(([key, meta]) => {
    const keywordHits = meta.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
    return {
      key,
      name: meta.name,
      confidence: Number(Math.min(0.35 + keywordHits * 0.18 + meta.priority * 0.05, 0.98).toFixed(2))
    };
  });

  const normalized = scored.filter((agent) => agent.confidence >= 0.35);
  const requiresAnalytics = /campaign|launch|customer|lead|pipeline/.test(text) && !normalized.some((agent) => agent.key === 'analytics');
  if (requiresAnalytics) {
    normalized.push({ key: 'analytics', name: 'Analytics', confidence: 0.42 });
  }
  const requiresSupport = /support|ticket|issue|help|resolve|incident/.test(text) && !normalized.some((agent) => agent.key === 'support');
  if (requiresSupport) {
    normalized.push({ key: 'support', name: 'Support', confidence: 0.61 });
  }

  normalized.sort((a, b) => b.confidence - a.confidence);
  const ordered = [];
  if (normalized.some((agent) => agent.key === 'sales')) ordered.push(normalized.find((agent) => agent.key === 'sales'));
  if (normalized.some((agent) => agent.key === 'marketing')) ordered.push(normalized.find((agent) => agent.key === 'marketing'));
  if (normalized.some((agent) => agent.key === 'support')) ordered.push(normalized.find((agent) => agent.key === 'support'));
  if (normalized.some((agent) => agent.key === 'analytics')) ordered.push(normalized.find((agent) => agent.key === 'analytics'));

  return ordered.filter(Boolean);
};

export const buildSharedContext = async (userId) => {
  const [leadRows, campaignRows, ticketRows, report] = await Promise.all([
    fetchAll('SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [userId]),
    fetchAll('SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [userId]),
    fetchAll('SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [userId]),
    buildReport(userId)
  ]);

  return {
    leads: leadRows,
    campaigns: campaignRows,
    tickets: ticketRows,
    analytics: report
  };
};

export const createOrchestratorService = ({
  fetchAllFn = fetchAll,
  fetchOneFn = fetchOne,
  executeFn = execute,
  createLeadFn = createLeadService,
  scoreLeadFn = scoreLeadService,
  generateCampaignFn = generateCampaign,
  buildReportFn = buildReport,
  generateAiFn = generateAiResponse,
  buildSharedContextFn = buildSharedContext,
  decideAgentsFn = decideAgents
} = {}) => {
  const branchPlan = (selected, request) => {
    const text = `${request?.request || ''} ${request?.goal || ''}`.toLowerCase();
    const workflowOrder = Array.isArray(request?.workflow?.order) ? request.workflow.order : [];
    const orderedByWorkflow = workflowOrder.length
      ? workflowOrder
          .map((key) => selected.find((agent) => agent.key === key))
          .filter(Boolean)
      : selected;

    if (/complex|nested|multi-step|handoff|approval/.test(text)) {
      return [
        ...orderedByWorkflow,
        ...(orderedByWorkflow.some((agent) => agent.key === 'support') ? [] : [{ key: 'support', name: 'Support', confidence: 0.52 }]),
        ...(orderedByWorkflow.some((agent) => agent.key === 'analytics') ? [] : [{ key: 'analytics', name: 'Analytics', confidence: 0.45 }])
      ].filter((agent, index, list) => list.findIndex((item) => item.key === agent.key) === index);
    }
    return orderedByWorkflow;
  };

  const buildPhaseBreakdown = (startedAt, completedAt) => {
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const total = Math.max(0, end - start);
    const planning = Math.round(total * 0.25);
    const execution = Math.round(total * 0.5);
    const persistence = Math.max(0, total - planning - execution);
    return {
      planningMs: planning,
      executionMs: execution,
      persistenceMs: persistence,
      totalMs: total
    };
  };

  const recordRun = async (userId, request, selectedAgents, confidence) =>
    fetchOneFn(
    `INSERT INTO orchestration_runs (user_id, request, selected_agents, status, confidence, shared_context)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, request.request, JSON.stringify(selectedAgents), 'running', confidence, JSON.stringify(request.context || {})]
  );

  const recordStep = async (runId, agent, status, output, confidence, startedAt = null, completedAt = null, phaseBreakdown = {}) =>
    fetchOneFn(
    `INSERT INTO orchestration_steps (run_id, agent, status, output, confidence, started_at, completed_at, phase_breakdown)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [runId, agent, status, JSON.stringify(output), confidence, startedAt, completedAt, JSON.stringify(phaseBreakdown)]
  );

  const updateRunStatus = async (runId, status, outcome = null) =>
    fetchOneFn(
    `UPDATE orchestration_runs
     SET status = $2, outcome = $3, completed_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [runId, status, JSON.stringify(outcome)]
  );

  const recordNotification = async (userId, runId, type, title, message, payload = {}) =>
    executeFn(
      `INSERT INTO orchestration_notifications (user_id, run_id, type, title, message, status, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, runId, type, title, message, 'unread', JSON.stringify(payload)]
    );

  const routeSales = async (userId, request, context) => {
    const lead = await createLeadFn(userId, {
    name: request.context?.customer?.name || 'New Customer',
    email: request.context?.customer?.email || 'unknown@example.com',
    company: request.context?.customer?.company || request.context?.company || 'Unknown',
    budget: request.context?.budget || 'unknown',
    urgency: request.context?.urgency || 'medium',
    companySize: request.context?.companySize || 'unknown',
    interest: request.context?.interest || request.request,
    notes: request.request
  });

    const scored = await scoreLeadFn(userId, lead.id);
    return {
      lead: scored.lead,
      ai: scored.ai,
      sharedContext: context
    };
  };

  const routeMarketing = async (userId, request, context) => {
    const input = {
    audience: request.context?.audience || request.context?.customer?.segment || 'new customers',
    objective: request.goal || request.request,
    tone: request.context?.tone || 'professional',
    platform: request.context?.platform || 'linkedin'
  };
    const generated = await generateCampaignFn(userId, input);
    return {
      campaign: generated.campaign,
      ai: generated.ai,
      sharedContext: context
    };
  };

  const routeAnalytics = async (userId, _request, context) => ({
    report: await buildReportFn(userId),
    sharedContext: context
  });

  const routeSupport = async (userId, request, context) => {
    const supportMessage = request.goal || request.request;
    const aiResponse = await chatSupport(userId, supportMessage, []);
    const ticket = await createTicket(userId, {
      customerName: request.context?.customer?.name || 'New Customer',
      subject: request.request,
      status: 'open',
      priority: request.context?.urgency === 'high' ? 'high' : 'normal',
      history: [{ role: 'user', content: supportMessage }],
      aiResponse: aiResponse.response || aiResponse
    });

    return {
      ticket,
      ai: aiResponse,
      sharedContext: context
    };
  };

  const actionMap = {
    sales: routeSales,
    marketing: routeMarketing,
    support: routeSupport,
    analytics: routeAnalytics
  };

  const runOrchestration = async (userId, request) => {
    if (!request?.request) throw new ApiError(400, 'Request is required');

    const sharedContext = await buildSharedContextFn(userId);
    const approvals = Array.isArray(request.approvals) ? request.approvals : [];
    const selected = branchPlan(decideAgentsFn(request), request)
      .filter((agent) => {
        const approval = approvals.find((item) => item.agent === agent.key);
        return !approval || approval.approved !== false;
      });
    if (!selected.length) throw new ApiError(400, 'Unable to determine an agent plan');

    const run = await recordRun(userId, request, selected, selected[0].confidence);
    const steps = [];
    const outputs = {};

    for (const agent of selected) {
      const handler = actionMap[agent.key];
      if (!handler) continue;
      const startedAt = new Date().toISOString();
      const stepResult = await handler(userId, request, sharedContext);
      outputs[agent.key] = stepResult;
      const completedAt = new Date().toISOString();
      const phaseBreakdown = buildPhaseBreakdown(startedAt, completedAt);
      steps.push(await recordStep(run.id, agent.key, 'completed', stepResult, agent.confidence, startedAt, completedAt, phaseBreakdown));
    }

    const summaryPrompt = templates.analyticsSummary({
      metrics: {
        request: request.request,
        selectedAgents: selected.map((agent) => agent.name),
        outcomes: Object.keys(outputs)
      }
    });

    const synthesis = await generateAiFn({
      userId,
      module: 'orchestrator',
      prompt: summaryPrompt,
      cacheKey: `${userId}:orchestrator:${request.request}:${selected.map((agent) => agent.key).join(',')}`,
      metadata: { logAction: 'orchestrator.run', meta: { request: request.request, agents: selected.map((agent) => agent.key) } }
    });

    const completed = await updateRunStatus(run.id, 'completed', {
      selectedAgents: selected,
      outputs,
      synthesis: synthesis.response
    });
    await recordNotification(
      userId,
      run.id,
      'run.completed',
      'Orchestration completed',
      `The request "${request.request}" finished successfully.`,
      { selectedAgents: selected.map((agent) => agent.key), outputs }
    );

    return {
      run: completed,
      selectedAgents: selected,
      outputs,
      synthesis: synthesis.response,
      steps
    };
  };

  const streamOrchestration = async (userId, request, onEvent = async () => {}) => {
    await onEvent({ type: 'start', request: request.request });
    const sharedContext = await buildSharedContextFn(userId);
    await onEvent({ type: 'context', sharedContext });
    const selected = branchPlan(decideAgentsFn(request), request);
    const approvals = Array.isArray(request.approvals) ? request.approvals : [];
    const filtered = selected.filter((agent) => {
      const approval = approvals.find((item) => item.agent === agent.key);
      return !approval || approval.approved !== false;
    });
    const run = await recordRun(userId, request, filtered, filtered[0]?.confidence || 0);
    const steps = [];
    const outputs = {};

    for (const agent of filtered) {
      await onEvent({ type: 'agent:start', agent: agent.key, confidence: agent.confidence });
      const handler = actionMap[agent.key];
      if (!handler) continue;
      const startedAt = new Date().toISOString();
      const stepResult = await handler(userId, request, sharedContext);
      outputs[agent.key] = stepResult;
      const completedAt = new Date().toISOString();
      const phaseBreakdown = buildPhaseBreakdown(startedAt, completedAt);
      const step = await recordStep(run.id, agent.key, 'completed', stepResult, agent.confidence, startedAt, completedAt, phaseBreakdown);
      steps.push(step);
      await onEvent({ type: 'agent:complete', agent: agent.key, step });
    }

    const summaryPrompt = templates.analyticsSummary({
      metrics: {
        request: request.request,
        selectedAgents: filtered.map((agent) => agent.name),
        outcomes: Object.keys(outputs)
      }
    });

    const synthesis = await generateAiFn({
      userId,
      module: 'orchestrator',
      prompt: summaryPrompt,
      cacheKey: `${userId}:orchestrator:${request.request}:${filtered.map((agent) => agent.key).join(',')}`,
      metadata: { logAction: 'orchestrator.run', meta: { request: request.request, agents: filtered.map((agent) => agent.key) } }
    });
    const completed = await updateRunStatus(run.id, 'completed', {
      selectedAgents: filtered,
      outputs,
      synthesis: synthesis.response
    });
    await recordNotification(
      userId,
      run.id,
      'run.completed',
      'Orchestration completed',
      `The request "${request.request}" finished successfully.`,
      { selectedAgents: filtered.map((agent) => agent.key), outputs }
    );
    await onEvent({ type: 'done', run: completed, outputs, synthesis: synthesis.response });
    return { run: completed, selectedAgents: filtered, outputs, synthesis: synthesis.response, steps };
  };

  const listRuns = async (userId) => fetchAllFn(
  `SELECT * FROM orchestration_runs WHERE user_id = $1 ORDER BY created_at DESC`,
  [userId]
);

  const getRun = async (userId, runId) => {
    const run = await fetchOneFn(
      `SELECT * FROM orchestration_runs WHERE user_id = $1 AND id = $2`,
      [userId, runId]
    );
    if (!run) return null;

    const steps = await fetchAllFn(
      `SELECT * FROM orchestration_steps WHERE run_id = $1 ORDER BY created_at ASC`,
      [runId]
    );

    return { run, steps };
  };

  const compareRuns = async (userId, runIds = []) => {
    const rows = [];
    for (const runId of runIds.slice(0, 5)) {
      const run = await getRun(userId, runId);
      if (run) rows.push(run);
    }
    return rows;
  };

  const getStats = async (userId) => {
    const [runs, steps] = await Promise.all([
      fetchAllFn(`SELECT * FROM orchestration_runs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]),
      fetchAllFn(`SELECT * FROM orchestration_steps WHERE run_id IN (SELECT id FROM orchestration_runs WHERE user_id = $1) ORDER BY created_at DESC LIMIT 200`, [userId])
    ]);

    const totalRuns = runs.length;
    const completedRuns = runs.filter((run) => run.status === 'completed').length;
    const avgConfidence = totalRuns
      ? Number((runs.reduce((sum, run) => sum + Number(run.confidence || 0), 0) / totalRuns).toFixed(2))
      : 0;
    const byAgent = steps.reduce((acc, step) => {
      const bucket = acc[step.agent] || { agent: step.agent, count: 0, avgConfidence: 0, avgLatencyMs: 0 };
      bucket.count += 1;
      bucket.avgConfidence = Number((((bucket.avgConfidence * (bucket.count - 1)) + Number(step.confidence || 0)) / bucket.count).toFixed(2));
      const stepLatency = step.started_at && step.completed_at
        ? Math.max(0, new Date(step.completed_at).getTime() - new Date(step.started_at).getTime())
        : 0;
      bucket.avgLatencyMs = Number((((bucket.avgLatencyMs * (bucket.count - 1)) + stepLatency) / bucket.count).toFixed(2));
      acc[step.agent] = bucket;
      return acc;
    }, {});

    return {
      totalRuns,
      completedRuns,
      successRate: totalRuns ? Number(((completedRuns / totalRuns) * 100).toFixed(2)) : 0,
      avgConfidence,
      byAgent: Object.values(byAgent)
    };
  };

  const getNotifications = async (userId) => {
    const rows = await fetchAllFn(
      `SELECT id, run_id, type, title, message, status, payload, created_at, updated_at
       FROM orchestration_notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      status: row.status,
      createdAt: row.updated_at || row.created_at,
      outcome: row.payload
    }));
  };

  const buildWorkflowPreview = async (request) => {
    const selected = branchPlan(decideAgentsFn(request), request);
    const approvals = Array.isArray(request.approvals) ? request.approvals : [];
    const filtered = selected.filter((agent) => {
      const approval = approvals.find((item) => item.agent === agent.key);
      return !approval || approval.approved !== false;
    });

    const nodes = filtered.map((agent, index) => ({
      id: agent.key,
      label: agent.name,
      confidence: agent.confidence,
      next: filtered[index + 1]?.key || null
    }));

    return { nodes, selectedAgents: filtered };
  };

  const getAgentTiming = async (userId) => {
    const runs = await fetchAllFn(`SELECT id, created_at, completed_at, selected_agents FROM orchestration_runs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25`, [userId]);
    const steps = await fetchAllFn(`SELECT run_id, agent, started_at, completed_at, phase_breakdown FROM orchestration_steps WHERE run_id IN (SELECT id FROM orchestration_runs WHERE user_id = $1) ORDER BY created_at DESC LIMIT 250`, [userId]);
    const grouped = {};
    runs.forEach((run) => {
      grouped[run.id] = { runId: run.id, startedAt: run.created_at, completedAt: run.completed_at, agents: [] };
    });
    steps.forEach((step) => {
      if (!grouped[step.run_id]) return;
      grouped[step.run_id].agents.push({
        agent: step.agent,
        startedAt: step.started_at,
        completedAt: step.completed_at,
        latencyMs: step.started_at && step.completed_at ? Math.max(0, new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()) : 0,
        phaseBreakdown: step.phase_breakdown || {}
      });
    });

    return Object.values(grouped);
  };

  const exportTelemetry = async (userId) => {
    const [stats, timings, notifications] = await Promise.all([
      getStats(userId),
      getAgentTiming(userId),
      getNotifications(userId)
    ]);
    return { exportedAt: new Date().toISOString(), stats, timings, notifications };
  };

  const exportRun = async (userId, runId) => {
    const run = await getRun(userId, runId);
    if (!run) return null;
    return {
      exportedAt: new Date().toISOString(),
      run
    };
  };

  return { runOrchestration, streamOrchestration, listRuns, getRun, compareRuns, getStats, getNotifications, buildWorkflowPreview, getAgentTiming, exportTelemetry, exportRun };
};

const defaultOrchestrator = createOrchestratorService();

export const runOrchestration = defaultOrchestrator.runOrchestration;
export const streamOrchestration = defaultOrchestrator.streamOrchestration;
export const listRuns = defaultOrchestrator.listRuns;
export const getRun = defaultOrchestrator.getRun;
export const compareRuns = defaultOrchestrator.compareRuns;
export const getStats = defaultOrchestrator.getStats;
export const getNotifications = defaultOrchestrator.getNotifications;
export const buildWorkflowPreview = defaultOrchestrator.buildWorkflowPreview;
export const getAgentTiming = defaultOrchestrator.getAgentTiming;
export const exportTelemetry = defaultOrchestrator.exportTelemetry;
export const exportRun = defaultOrchestrator.exportRun;
