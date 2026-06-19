import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import {
  ArrowRight,
  Bell,
  ClipboardList,
  Download,
  Gauge,
  GitBranch,
  GripVertical,
  History,
  Layers3,
  MoveDown,
  MoveUp,
  RefreshCcw,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Workflow
} from 'lucide-react';

const presets = [
  {
    label: 'Campaign preset',
    request: 'Generate campaign for new customer',
    goal: 'Qualify the lead, launch the campaign, and summarize performance impact.',
    context: {
      customer: { name: 'Acme', email: 'buyer@example.com', company: 'Acme Ltd' },
      budget: '10000',
      urgency: 'high',
      companySize: '200',
      audience: 'B2B teams',
      tone: 'confident',
      platform: 'linkedin'
    }
  },
  {
    label: 'Support preset',
    request: 'Create a support recovery plan for a priority enterprise account',
    goal: 'Resolve the issue, preserve the relationship, and outline next actions.',
    context: {
      customer: { name: 'Northstar', email: 'ops@northstar.com', company: 'Northstar Group' },
      urgency: 'high',
      platform: 'email',
      audience: 'enterprise users'
    }
  }
];

const agents = ['sales', 'marketing', 'support', 'analytics'];
const diffValue = (a, b) => (a === b ? { state: 'same', label: 'same' } : { state: 'diff', label: 'changed' });

const Collaboration = () => {
  const [request, setRequest] = useState(presets[0].request);
  const [goal, setGoal] = useState(presets[0].goal);
  const [context, setContext] = useState(JSON.stringify(presets[0].context, null, 2));
  const [result, setResult] = useState(null);
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [approvals, setApprovals] = useState({ sales: true, marketing: true, support: true, analytics: true });
  const [workflowOrder, setWorkflowOrder] = useState(['sales', 'marketing', 'support', 'analytics']);
  const [comparison, setComparison] = useState([]);
  const [comparisonSelection, setComparisonSelection] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [workflowPreview, setWorkflowPreview] = useState(null);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [timings, setTimings] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [telemetry, setTelemetry] = useState(null);

  const loadPanels = useCallback(async () => {
    const [{ data: runsData }, { data: statsData }, { data: noteData }, { data: timingData }, { data: telemetryData }] = await Promise.all([
      api.get('/orchestrator/runs'),
      api.get('/orchestrator/stats'),
      api.get('/orchestrator/notifications'),
      api.get('/orchestrator/timings'),
      api.get('/orchestrator/telemetry/export')
    ]);

    setRuns(runsData.runs || []);
    setStats(statsData.stats || null);
    setNotifications(noteData.notifications || []);
    setTimings(timingData.timings || []);
    setTelemetry(telemetryData || null);

    if (!selectedRunId && runsData.runs?.length) setSelectedRunId(runsData.runs[0].id);
  }, [selectedRunId]);

  useEffect(() => { loadPanels(); }, [loadPanels]);

  useEffect(() => {
    if (!selectedRunId) return;
    (async () => {
      const { data } = await api.get(`/orchestrator/runs/${selectedRunId}`);
      setSelectedRun(data);
    })();
  }, [selectedRunId]);

  const parsedContext = useMemo(() => {
    try { return JSON.parse(context); } catch { return {}; }
  }, [context]);

  const applyPreset = (preset) => {
    setRequest(preset.request);
    setGoal(preset.goal);
    setContext(JSON.stringify(preset.context, null, 2));
  };

  const moveWorkflow = (index, direction) => {
    setWorkflowOrder((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const dropWorkflow = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setWorkflowOrder((current) => {
      const next = [...current];
      const [picked] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, picked);
      return next;
    });
    setDragIndex(null);
  };

  const previewWorkflow = async () => {
    const { data } = await api.post('/orchestrator/preview', {
      request,
      goal,
      context: parsedContext,
      approvals: Object.entries(approvals).map(([agent, approved]) => ({ agent, approved })),
      workflow: { order: workflowOrder }
    });
    setWorkflowPreview(data);
  };

  const readStream = async (payload, attempt = 0) => {
    const response = await globalThis.fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/orchestrator/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      body: JSON.stringify(payload)
    });
    if (!response.ok || !response.body) {
      if (attempt < 1) return readStream(payload, attempt + 1);
      throw new Error('stream failed');
    }
    const reader = response.body.getReader();
    const decoder = new globalThis.TextDecoder();
    let buffer = '';
    let finalResult = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';
      chunks.forEach((chunk) => {
        const line = chunk.split('data: ').pop();
        if (!line) return;
        const event = JSON.parse(line);
        setLiveEvents((current) => [...current, event]);
        if (event.type === 'result') finalResult = event.result;
      });
    }
    return finalResult;
  };

  const runFlow = async () => {
    const payload = {
      request,
      goal,
      context: parsedContext,
      approvals: Object.entries(approvals).map(([agent, approved]) => ({ agent, approved })),
      workflow: { order: workflowOrder }
    };
    setLiveEvents([]);
    const finalResult = await readStream(payload);
    setResult(finalResult);
    await loadPanels();
    setSelectedRunId(finalResult.run.id);
  };

  const exportRun = async (runId) => {
    const { data } = await api.get(`/orchestrator/runs/${runId}/export`);
    const blob = new globalThis.Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orchestration-run-${runId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    globalThis.URL.revokeObjectURL(url);
  };

  const compareSelected = async () => {
    const ids = (comparisonSelection.length ? comparisonSelection : runs.slice(0, 5).map((run) => run.id)).slice(0, 5);
    if (ids.length < 2) return;
    const { data } = await api.get(`/orchestrator/compare?ids=${ids.join(',')}`);
    setComparison(data.comparisons || []);
  };

  const chain = result?.selectedAgents || selectedRun?.run?.selected_agents || [];
  const outcome = result?.outputs || selectedRun?.run?.outcome?.outputs || {};
  const steps = result?.steps || selectedRun?.steps || [];
  const synthesis = result?.synthesis || selectedRun?.run?.outcome?.synthesis || {};
  const comparisonBase = comparison[0]?.run?.outcome?.outputs || {};

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Agent Collaboration"
          title="Collaboration"
          description="Send one request and watch the orchestrator route it through the right agents with shared context, approvals, workflow order, and live handoffs."
          actions={(
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3">
              <p className="flex items-center gap-2 font-semibold"><Workflow size={16} /> Orchestrated flow</p>
              <p className="mt-1 text-xs text-slate-500">Sales, marketing, support, analytics</p>
            </div>
          )}
        />

        <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-semibold"><Gauge size={16} /> Orchestration stats</p>
                <Button variant="secondary" onClick={loadPanels}><RefreshCcw size={16} /> Refresh</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
                  <p className="text-xs uppercase text-slate-500">Success rate</p>
                  <p className="mt-1 text-2xl font-semibold">{stats ? `${stats.successRate}%` : '0%'}</p>
                </div>
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
                  <p className="text-xs uppercase text-slate-500">Avg confidence</p>
                  <p className="mt-1 text-2xl font-semibold">{stats ? `${stats.avgConfidence}` : '0.00'}</p>
                </div>
              </div>
              <div className="space-y-2">
                {(stats?.byAgent || []).map((agent) => (
                  <div key={agent.agent} className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{agent.agent}</span>
                      <span className="text-xs text-slate-500">{agent.count} runs</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Avg confidence {agent.avgConfidence}</p>
                  </div>
                ))}
                {!stats?.byAgent?.length ? <EmptyState title="No stats yet" description="Run a collaboration flow to populate per-agent metrics." /> : null}
              </div>
            </Card>

            <Card className="space-y-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16} /> Approvals</p>
              <div className="grid grid-cols-2 gap-2">
                {agents.map((agent) => (
                  <button
                    key={agent}
                    onClick={() => setApprovals((current) => ({ ...current, [agent]: !current[agent] }))}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${approvals[agent] ? 'border-emerald-300 bg-emerald-50 text-ink' : 'border-[var(--ui-border)] bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)]'}`}
                  >
                    {agent} {approvals[agent] ? 'approved' : 'paused'}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold"><GripVertical size={16} /> Workflow order</p>
                <Button variant="secondary" onClick={() => setWorkflowOrder(['sales', 'marketing', 'support', 'analytics'])}><RotateCcw size={14} /> Reset</Button>
              </div>
              <div className="space-y-2">
                {workflowOrder.map((agent, index) => (
                  <div
                    key={agent}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dropWorkflow(index)}
                    className="flex items-center justify-between rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2"
                  >
                    <span className="text-sm font-medium capitalize">{agent}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveWorkflow(index, -1)} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2"><MoveUp size={14} /></button>
                      <button onClick={() => moveWorkflow(index, 1)} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2"><MoveDown size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button key={preset.label} onClick={() => applyPreset(preset)} className="rounded-full border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold transition hover:bg-[var(--ui-surface-muted)]">
                    {preset.label}
                  </button>
                ))}
              </div>
              <input value={request} onChange={(e) => setRequest(e.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 outline-none focus:border-[var(--ui-focus)] focus:ring-4 focus:ring-blue-100/50" />
              <input value={goal} onChange={(e) => setGoal(e.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 outline-none focus:border-[var(--ui-focus)] focus:ring-4 focus:ring-blue-100/50" />
              <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={12} className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 font-mono text-sm outline-none focus:border-[var(--ui-focus)] focus:ring-4 focus:ring-blue-100/50" />
              <div className="grid gap-2">
                <button onClick={previewWorkflow} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--ui-border)] px-4 font-semibold transition hover:bg-[var(--ui-surface-muted)]">
                  <Workflow size={16} /> Preview workflow
                </button>
                <button onClick={runFlow} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--ui-accent)] px-4 font-semibold text-white transition hover:-translate-y-0.5">
                  <Sparkles size={16} /> Run orchestration <ArrowRight size={16} />
                </button>
                <button onClick={compareSelected} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--ui-border)] px-4 font-semibold transition hover:bg-[var(--ui-surface-muted)]">
                  <Layers3 size={16} /> Compare recent runs
                </button>
              </div>
            </Card>

            <Card className="space-y-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><Bell size={16} /> Notifications</p>
              <div className="space-y-2">
                {notifications.length ? notifications.map((note) => (
                  <div key={note.id} className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2 text-sm">
                    <p className="font-medium">{note.title}</p>
                    <p className="text-xs text-slate-500">{note.message}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">Completed runs will surface here.</p>}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold"><GitBranch size={18} /> Agent chain</h2>
                <Button variant="secondary" onClick={loadPanels}><RefreshCcw size={16} /> Refresh</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                {chain.length ? chain.map((agent, index) => (
                  <div key={`${agent.key}-${index}`} className="flex items-center gap-3">
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3 shadow-sm">
                      <p className="text-xs uppercase text-slate-500">{agent.key}</p>
                      <p className="mt-1 font-semibold">{agent.name}</p>
                      <p className="mt-1 text-xs text-slate-500">Confidence {(Number(agent.confidence) * 100).toFixed(0)}%</p>
                    </div>
                    {index < chain.length - 1 ? <ArrowRight size={18} className="text-slate-400" /> : null}
                  </div>
                )) : <EmptyState title="No handoff chain yet" description="Run a request to see the orchestration chain appear." />}
              </div>

              {liveEvents.length > 0 && (
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Live progress</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {agents.map((agent) => {
                      const start = liveEvents.find((event) => event.type === 'agent:start' && event.agent === agent);
                      const done = liveEvents.find((event) => event.type === 'agent:complete' && event.agent === agent);
                      const state = done ? 'done' : start ? 'running' : 'idle';
                      return (
                        <div key={agent} className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm">
                          <p className="capitalize font-medium">{agent}</p>
                          <p className="text-xs text-slate-500">{state}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
              <Card className="space-y-4">
                <h2 className="flex items-center gap-2 font-semibold"><Workflow size={18} /> Handoff details</h2>
                <div className="space-y-3">
                  {steps.length ? steps.map((step) => (
                    <article key={step.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold capitalize">{step.agent}</p>
                        <Badge tone={step.status === 'completed' ? 'success' : 'default'}>{step.status}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Confidence {(Number(step.confidence) * 100).toFixed(0)}%</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Latency {step.started_at && step.completed_at ? `${new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()}ms` : 'n/a'}
                      </p>
                      {step.phase_breakdown ? (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div className="rounded-lg bg-[var(--ui-surface)] px-2 py-1">Plan {step.phase_breakdown.planningMs ?? 0}ms</div>
                          <div className="rounded-lg bg-[var(--ui-surface)] px-2 py-1">Exec {step.phase_breakdown.executionMs ?? 0}ms</div>
                          <div className="rounded-lg bg-[var(--ui-surface)] px-2 py-1">Persist {step.phase_breakdown.persistenceMs ?? 0}ms</div>
                          <div className="rounded-lg bg-[var(--ui-surface)] px-2 py-1">Total {step.phase_breakdown.totalMs ?? 0}ms</div>
                        </div>
                      ) : null}
                      <pre className="mt-3 overflow-auto text-xs text-slate-700">{JSON.stringify(step.output, null, 2)}</pre>
                    </article>
                  )) : <EmptyState title="Step details will appear here" description="Run orchestration to inspect agent outputs and phase timings." />}
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="space-y-4">
                  <h2 className="font-semibold">Run history</h2>
                  <div className="space-y-2">
                    {runs.map((run) => (
                      <button
                        key={run.id}
                        onClick={() => setSelectedRunId(run.id)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${selectedRunId === run.id ? 'border-[var(--ui-accent)] bg-blue-50/60' : 'border-[var(--ui-border)] hover:bg-[var(--ui-surface-muted)]'}`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={comparisonSelection.includes(run.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setComparisonSelection((current) => (
                                e.target.checked ? [...current, run.id] : current.filter((id) => id !== run.id)
                              ));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{run.request}</p>
                            <p className="mt-1 text-xs text-slate-500">{new Date(run.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button onClick={(e) => { e.stopPropagation(); exportRun(run.id); }} className="inline-flex items-center gap-1 rounded-full border border-[var(--ui-border)] px-2 py-1 text-[11px] font-semibold transition hover:bg-[var(--ui-surface-muted)]"><Download size={12} /> Export</button>
                          <button onClick={(e) => { e.stopPropagation(); globalThis.navigator.clipboard.writeText(`${globalThis.location.origin}/collaboration?run=${run.id}`); }} className="inline-flex items-center gap-1 rounded-full border border-[var(--ui-border)] px-2 py-1 text-[11px] font-semibold transition hover:bg-[var(--ui-surface-muted)]"><Share2 size={12} /> Share</button>
                          <button onClick={(e) => { e.stopPropagation(); setComparisonSelection((current) => (current.includes(run.id) ? current.filter((id) => id !== run.id) : [...current, run.id])); }} className="inline-flex items-center gap-1 rounded-full border border-[var(--ui-border)] px-2 py-1 text-[11px] font-semibold transition hover:bg-[var(--ui-surface-muted)]">
                            {comparisonSelection.includes(run.id) ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card className="space-y-4">
                  <h2 className="font-semibold">Confidence and explanation</h2>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <p className="text-xs uppercase text-slate-500">Selected agents</p>
                      <p className="mt-1 text-sm font-medium leading-6">{chain.map((agent) => agent.name).join(' → ') || 'No run yet'}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <p className="text-xs uppercase text-slate-500">Synthesis</p>
                      <pre className="mt-2 overflow-auto text-xs text-slate-700">{JSON.stringify(synthesis, null, 2)}</pre>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Card>
              <h2 className="flex items-center gap-2 font-semibold"><Download size={18} /> Export and share</h2>
              <p className="mt-2 text-sm text-slate-600">Export a run as JSON or share the run link with your team to review the handoff chain.</p>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold"><History size={18} /> Run detail density</h2>
                <Badge tone="accent">{runs.length} runs</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {runs.slice(0, 4).map((run) => (
                  <div key={`detail-${run.id}`} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase text-slate-500">Run</p>
                    <p className="mt-1 text-sm font-semibold leading-6">{run.request}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(run.created_at).toLocaleString()}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[var(--ui-surface)] px-2 py-2 text-center">
                        <p className="text-[10px] uppercase text-slate-400">Selected</p>
                        <p className="mt-1 text-sm font-semibold">{(run.selected_agents || []).length || 0}</p>
                      </div>
                      <div className="rounded-xl bg-[var(--ui-surface)] px-2 py-2 text-center">
                        <p className="text-[10px] uppercase text-slate-400">Confidence</p>
                        <p className="mt-1 text-sm font-semibold">{run.outcome?.confidence ? `${Math.round(run.outcome.confidence * 100)}%` : 'n/a'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {!runs.length ? <EmptyState title="No run history yet" description="Execute orchestration to populate this density view." /> : null}
              </div>
            </Card>

            {workflowPreview && (
              <Card className="space-y-4">
                <h2 className="flex items-center gap-2 font-semibold"><ClipboardList size={18} /> Workflow preview</h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {workflowPreview.nodes.map((node) => (
                    <div key={node.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <p className="font-semibold capitalize">{node.label}</p>
                      <p className="mt-1 text-xs text-slate-500">Confidence {(Number(node.confidence) * 100).toFixed(0)}%</p>
                      <p className="mt-2 text-xs text-slate-500">Next: {node.next || 'end'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {comparison.length > 0 && (
              <Card className="space-y-4">
                <h2 className="flex items-center gap-2 font-semibold"><ClipboardList size={18} /> Side-by-side comparison</h2>
                <p className="text-xs text-slate-500">Select up to five runs to compare outputs and handoffs.</p>
                <div className="grid gap-4 xl:grid-cols-2">
                  {comparison.map((item) => (
                    <article key={item.run.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <p className="text-sm font-semibold">{item.run.request}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(item.run.created_at).toLocaleString()}</p>
                      <div className="mt-3 space-y-2">
                        {Object.entries(item.run.outcome?.outputs || {}).map(([key, value]) => {
                          const ref = comparisonBase[key];
                          const state = diffValue(JSON.stringify(ref), JSON.stringify(value));
                          return (
                            <div key={key} className={`rounded-xl border px-3 py-2 text-xs ${state.state === 'diff' ? 'border-[var(--ui-accent)] bg-blue-50/60' : 'border-[var(--ui-border)] bg-[var(--ui-surface)]'}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium capitalize">{key}</span>
                                <span>{state.label}</span>
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">Against the baseline comparison run.</div>
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                <div className="rounded-lg bg-[var(--ui-surface)] p-2">
                                  <p className="text-[10px] uppercase text-slate-400">Baseline</p>
                                  <pre className="mt-1 overflow-auto text-[11px]">{JSON.stringify(ref, null, 2)}</pre>
                                </div>
                                <div className="rounded-lg bg-[var(--ui-surface)] p-2">
                                  <p className="text-[10px] uppercase text-slate-400">Selected</p>
                                  <pre className="mt-1 overflow-auto text-[11px]">{JSON.stringify(value, null, 2)}</pre>
                                </div>
                              </div>
                              {state.state === 'diff' ? <div className="mt-2 h-1 rounded-full bg-[var(--ui-accent)]" /> : null}
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </Card>
            )}

            {timings.length > 0 && (
              <Card className="space-y-4">
                <h2 className="flex items-center gap-2 font-semibold"><Gauge size={18} /> Agent timings</h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {timings.map((item) => (
                    <div key={item.runId} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <p className="text-xs uppercase text-slate-500">Run</p>
                      <p className="mt-1 text-sm font-medium">{new Date(item.startedAt).toLocaleTimeString()}</p>
                      <p className="mt-2 text-xs text-slate-500">{item.agents.length} agent steps</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Avg latency {item.agents.length ? `${Math.round(item.agents.reduce((sum, agent) => sum + (agent.latencyMs || 0), 0) / item.agents.length)}ms` : '0ms'}
                      </p>
                      <div className="mt-3 space-y-1">
                        {item.agents.map((agent) => (
                          <div key={`${item.runId}-${agent.agent}`} className="rounded-lg bg-[var(--ui-surface)] px-2 py-1 text-[11px]">
                            <span className="font-medium capitalize">{agent.agent}</span>
                            <span className="ml-2 text-slate-500">{agent.latencyMs}ms</span>
                            {agent.phaseBreakdown ? (
                              <span className="ml-2 text-slate-400">plan {agent.phaseBreakdown.planningMs ?? 0} / exec {agent.phaseBreakdown.executionMs ?? 0} / persist {agent.phaseBreakdown.persistenceMs ?? 0}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {telemetry && (
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-semibold"><Download size={18} /> Telemetry export</h2>
                  <button
                    onClick={async () => {
                      const blob = new globalThis.Blob([JSON.stringify(telemetry, null, 2)], { type: 'application/json' });
                      const url = globalThis.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'orchestration-telemetry.json';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      globalThis.URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--ui-border)] px-3 py-2 text-sm transition hover:bg-[var(--ui-surface-muted)]"
                  >
                    Export telemetry
                  </button>
                </div>
                <p className="text-sm text-slate-600">Snapshot of stats, timings, and notifications for the collaboration layer.</p>
              </Card>
            )}

            {outcome && (
              <Card>
                <h2 className="font-semibold">Latest orchestration output</h2>
                <pre className="mt-3 overflow-auto text-sm">{JSON.stringify(outcome, null, 2)}</pre>
              </Card>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Collaboration;
