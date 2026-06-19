import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Input from '../components/ui/Input.jsx';
import { Activity, ArrowUpRight, BarChart3, CheckCircle2, HeartHandshake, ShieldCheck, TimerReset } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

const MiniTrend = ({ values = [], title, accent = '#2563eb' }) => {
  const width = 560;
  const height = 180;
  const padding = 18;
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((value / max) * (height - padding * 2));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-[var(--ui-text-muted)]">Observed over recent workspace activity.</p>
        </div>
        <Badge tone="accent">live</Badge>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-44 w-full" role="img" aria-label={title}>
        <polyline points={points} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
          const y = height - padding - ((value / max) * (height - padding * 2));
          return <circle key={`${title}-${index}`} cx={x} cy={y} r="5" fill={accent} stroke="white" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
};

const Monitoring = () => {
  const [dashboard, setDashboard] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [events, setEvents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventForm, setEventForm] = useState({ source: 'dashboard', eventType: 'page.view', status: 'info' });
  const [feedbackForm, setFeedbackForm] = useState({ source: 'workspace', rating: 5, comments: '' });
  const { pushToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, metricsRes, eventsRes, feedbackRes] = await Promise.all([
        api.get('/monitoring/dashboard'),
        api.get('/monitoring/metrics'),
        api.get('/monitoring/events'),
        api.get('/monitoring/feedback')
      ]);
      setDashboard(dashboardRes.data.dashboard);
      setMetrics(metricsRes.data.metrics || []);
      setEvents(eventsRes.data.events || []);
      setFeedback(feedbackRes.data.feedback || []);
    } catch (error) {
      pushToast({ tone: 'danger', title: 'Monitoring unavailable', message: error.response?.data?.message || error.message || 'Could not load monitoring data.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  const kpis = useMemo(() => dashboard?.kpis || {}, [dashboard]);
  const roi = useMemo(() => dashboard?.roi || {}, [dashboard]);
  const productivity = useMemo(() => dashboard?.productivity || [], [dashboard]);
  const workflowMetrics = useMemo(() => dashboard?.workflowMetrics || {}, [dashboard]);
  const systemStatus = useMemo(() => dashboard?.systemStatus || {}, [dashboard]);

  const metricsTrend = useMemo(() => [
    kpis.successRate || 0,
    kpis.errorRate || 0,
    kpis.apiUsage || 0,
    kpis.requestTracking || 0,
    kpis.avgLatencyMs || 0
  ], [kpis]);

  const submitEvent = async () => {
    try {
      await api.post('/monitoring/event', eventForm);
      pushToast({ tone: 'success', title: 'Event tracked', message: 'Monitoring event stored successfully.' });
      await load();
    } catch (error) {
      pushToast({ tone: 'danger', title: 'Event failed', message: error.response?.data?.message || 'Could not save event.' });
    }
  };

  const submitFeedback = async () => {
    try {
      await api.post('/monitoring/feedback', feedbackForm);
      pushToast({ tone: 'success', title: 'Feedback saved', message: 'Feedback was added to the learning loop.' });
      await load();
    } catch (error) {
      pushToast({ tone: 'danger', title: 'Feedback failed', message: error.response?.data?.message || 'Could not save feedback.' });
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Monitoring"
          title="Monitoring Dashboard"
          description="Review telemetry, executive KPIs, workflow performance, and feedback signals in one place."
          actions={<Badge tone="accent"><Activity size={14} className="mr-2 inline" /> system visible</Badge>}
        />

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="System status" value={kpis.systemStatus || 'Healthy'} detail={`Uptime ${kpis.uptime ?? 99.92}%`} icon={ShieldCheck} tone="success" />
              <StatCard label="Success rate" value={`${kpis.successRate ?? 0}%`} detail="Workflow completion ratio" icon={CheckCircle2} tone="success" />
              <StatCard label="API usage" value={kpis.apiUsage ?? 0} detail="AI generations and tracked requests" icon={BarChart3} tone="accent" />
              <StatCard label="Avg latency" value={`${Math.round(kpis.avgLatencyMs ?? 0)} ms`} detail="Average orchestration duration" icon={TimerReset} tone="warning" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Executive metrics</h2>
                  <Badge tone="accent">ROI dashboard</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Generated value</p>
                    <p className="mt-2 text-2xl font-semibold">${Number(roi.generatedValue || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Cost saved</p>
                    <p className="mt-2 text-2xl font-semibold">${Number(roi.costSaved || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Efficiency gain</p>
                    <p className="mt-2 text-2xl font-semibold">{Number(roi.efficiencyGain || 0)}%</p>
                  </div>
                </div>
                <MiniTrend values={metricsTrend} title="Monitoring signals" accent="#0f9f8f" />
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Continuous learning</h2>
                  <HeartHandshake size={18} className="text-[var(--ui-accent)]" />
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Feedback average</p>
                    <p className="mt-2 text-2xl font-semibold">{systemStatus.feedbackSummary?.average || 0}/5</p>
                    <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{systemStatus.feedbackSummary?.total || 0} collected responses</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Prompt improvement</p>
                    <p className="mt-2 text-sm text-[var(--ui-text)]">Usage signals and latency patterns can now be captured as feedback and events for prompt tuning.</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Metric samples</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.length}</p>
                    <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Historical tracking records available now.</p>
                  </div>
                </div>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Workflow metrics</h2>
                  <Badge tone="success">{workflowMetrics.totalRuns || 0} runs</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Healthy runs</p>
                    <p className="mt-2 text-2xl font-semibold">{workflowMetrics.healthyRuns || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Failed runs</p>
                    <p className="mt-2 text-2xl font-semibold">{workflowMetrics.failedRuns || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Avg duration</p>
                    <p className="mt-2 text-2xl font-semibold">{Math.round(workflowMetrics.avgLatencyMs || 0)} ms</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(workflowMetrics.recentExecutions || []).length ? workflowMetrics.recentExecutions.map((run) => (
                    <div key={run.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{run.id}</p>
                          <p className="text-xs text-[var(--ui-text-muted)]">{new Date(run.startedAt).toLocaleString()}</p>
                        </div>
                        <Badge tone={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'warning' : 'accent'}>{run.status}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-[var(--ui-text-muted)]">Selected agents: {(run.selectedAgents || []).join(', ') || 'none'}</p>
                    </div>
                  )) : <EmptyState title="No workflow runs yet" description="Run a workflow to populate health and latency metrics." />}
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Agent productivity</h2>
                    <ArrowUpRight size={18} className="text-emerald-500" />
                  </div>
                  {productivity.length ? productivity.map((item) => (
                    <div key={item.agent} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize">{item.agent}</span>
                        <Badge tone="accent">{item.count}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-[var(--ui-text-muted)]">Avg latency {Math.round(item.avgLatencyMs || 0)} ms · confidence {(item.avgConfidence || 0).toFixed(2)}</p>
                    </div>
                  )) : <EmptyState title="No productivity data" description="Agent productivity becomes visible after workflow runs complete." />}
                </Card>

                <Card className="space-y-4">
                  <h2 className="text-lg font-semibold">Feedback and events</h2>
                  <div className="space-y-2">
                    <Input value={eventForm.source} onChange={(e) => setEventForm((current) => ({ ...current, source: e.target.value }))} placeholder="Event source" />
                    <Input value={eventForm.eventType} onChange={(e) => setEventForm((current) => ({ ...current, eventType: e.target.value }))} placeholder="Event type" />
                    <Button variant="secondary" onClick={submitEvent}>Track event</Button>
                  </div>
                  <div className="space-y-2">
                    <Input value={feedbackForm.source} onChange={(e) => setFeedbackForm((current) => ({ ...current, source: e.target.value }))} placeholder="Feedback source" />
                    <Input type="number" min="1" max="5" value={feedbackForm.rating} onChange={(e) => setFeedbackForm((current) => ({ ...current, rating: Number(e.target.value) }))} placeholder="Rating" />
                    <textarea
                      value={feedbackForm.comments}
                      onChange={(e) => setFeedbackForm((current) => ({ ...current, comments: e.target.value }))}
                      rows={4}
                      className="w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2 text-sm outline-none"
                      placeholder="Feedback comments"
                    />
                    <Button variant="primary" onClick={submitFeedback}>Save feedback</Button>
                  </div>
                </Card>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <Card className="space-y-4">
                <h2 className="text-lg font-semibold">System logs</h2>
                {systemStatus.logs?.length ? systemStatus.logs.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4 text-sm">
                    <p className="font-medium">{item.module} · {item.action}</p>
                    <p className="text-xs text-[var(--ui-text-muted)]">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                )) : <EmptyState title="No logs" description="Activity logs appear when agents or modules emit usage signals." />}
              </Card>
              <Card className="space-y-4">
                <h2 className="text-lg font-semibold">Error tracking</h2>
                {events.length ? events.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{item.source}</p>
                      <Badge tone={item.status === 'error' ? 'warning' : 'accent'}>{item.status}</Badge>
                    </div>
                    <p className="text-xs text-[var(--ui-text-muted)]">{item.event_type}</p>
                  </div>
                )) : <EmptyState title="No events" description="Traced events will show up here after the first submission." />}
              </Card>
              <Card className="space-y-4">
                <h2 className="text-lg font-semibold">Feedback stream</h2>
                {feedback.length ? feedback.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{item.source}</p>
                      <Badge tone="success">{item.rating}/5</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ui-text-muted)]">{item.comments || 'No comments provided.'}</p>
                  </div>
                )) : <EmptyState title="No feedback yet" description="Feedback will populate as users rate the experience." />}
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Monitoring;
