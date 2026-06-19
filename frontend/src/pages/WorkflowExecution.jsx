import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { Activity, Play, Pause, RotateCcw, Square, TimerReset } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

const statusTone = {
  pending: 'warning',
  running: 'accent',
  success: 'success',
  failed: 'warning',
  cancelled: 'default',
  paused: 'warning'
};

const WorkflowExecution = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [runs, setRuns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [inputJson, setInputJson] = useState('{\n  "leadId": "lead-1"\n}');
  const [error, setError] = useState('');
  const { pushToast } = useToast();

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) || null,
    [workflows, selectedWorkflowId]
  );

  const activeRun = useMemo(() => runs[0] || null, [runs]);

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/workflow');
      const nextWorkflows = data.workflows || [];
      setWorkflows(nextWorkflows);
      const fallbackId = selectedWorkflowId || nextWorkflows[0]?.id || '';
      setSelectedWorkflowId(fallbackId);
      return fallbackId;
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load workflows');
      return '';
    } finally {
      setLoading(false);
    }
  }, [selectedWorkflowId]);

  const loadExecution = useCallback(async (workflowId) => {
    if (!workflowId) {
      setRuns([]);
      setLogs([]);
      return;
    }

    const [runsResponse, statusResponse] = await Promise.allSettled([
      api.get('/workflow/runs', { params: { workflowId } }),
      api.get('/workflow/status', { params: { workflowId } })
    ]);

    if (runsResponse.status === 'fulfilled') {
      setRuns(runsResponse.value.data.runs || []);
    }

    const latestRunId = runsResponse.status === 'fulfilled' ? runsResponse.value.data.runs?.[0]?.id : null;
    const statusRunId = statusResponse.status === 'fulfilled' ? statusResponse.value.data.workflowStatus?.id : null;
    const runId = latestRunId || statusRunId;

    if (runId) {
      try {
        const { data } = await api.get('/workflow/logs', { params: { workflowId, runId } });
        setLogs(data.logs || []);
      } catch {
        setLogs([]);
      }
    } else {
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const workflowId = await loadWorkflows();
      if (workflowId) await loadExecution(workflowId);
    })();
  }, [loadWorkflows, loadExecution]);

  useEffect(() => {
    if (!selectedWorkflowId) return;
    loadExecution(selectedWorkflowId);
  }, [selectedWorkflowId, loadExecution]);

  const refresh = async () => {
    await loadExecution(selectedWorkflowId);
  };

  const runWorkflow = async () => {
    try {
      setActionLoading(true);
      const input = inputJson.trim() ? JSON.parse(inputJson) : {};
      const { data } = await api.post('/workflow/run', { workflowId: selectedWorkflowId, triggerType: 'manual', input });
      pushToast({ tone: 'success', title: 'Workflow executed', message: data.message || 'The workflow run completed.' });
      await loadExecution(selectedWorkflowId);
    } catch (runError) {
      pushToast({ tone: 'danger', title: 'Execution failed', message: runError.response?.data?.message || runError.message || 'Could not execute workflow.' });
    } finally {
      setActionLoading(false);
    }
  };

  const triggerWorkflow = async () => {
    try {
      setActionLoading(true);
      const input = inputJson.trim() ? JSON.parse(inputJson) : {};
      await api.post('/workflow/trigger', { workflowId: selectedWorkflowId, triggerType: 'event', input });
      pushToast({ tone: 'info', title: 'Triggered', message: 'Workflow queued for execution.' });
      await loadExecution(selectedWorkflowId);
    } catch (triggerError) {
      pushToast({ tone: 'danger', title: 'Trigger failed', message: triggerError.response?.data?.message || triggerError.message || 'Could not trigger workflow.' });
    } finally {
      setActionLoading(false);
    }
  };

  const runAction = async (path, title) => {
    try {
      setActionLoading(true);
      await api.post(path, { workflowId: selectedWorkflowId });
      pushToast({ tone: 'success', title, message: 'Workflow state updated.' });
      await loadExecution(selectedWorkflowId);
    } catch (actionError) {
      pushToast({ tone: 'danger', title: `${title} failed`, message: actionError.response?.data?.message || actionError.message || 'Unable to update workflow.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Workflow execution"
          title="Execution Dashboard"
          description="Run workflows, inspect status transitions, and review the full execution timeline."
          actions={<Badge tone="accent"><Activity size={14} className="mr-2 inline" /> live state</Badge>}
        />

        <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Workflows</h2>
              <Button variant="secondary" onClick={refresh}>Refresh</Button>
            </div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : workflows.length ? (
              <div className="space-y-2">
                {workflows.map((workflow) => (
                  <button
                    key={workflow.id}
                    onClick={() => setSelectedWorkflowId(workflow.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${selectedWorkflowId === workflow.id ? 'border-[var(--ui-accent)] bg-blue-50/60' : 'border-[var(--ui-border)] bg-[var(--ui-surface-muted)] hover:bg-[var(--ui-surface-muted)]'}`}
                  >
                    <p className="font-medium">{workflow.name}</p>
                    <p className="mt-1 text-xs text-[var(--ui-text-muted)]">{workflow.trigger_type} · {workflow.status}</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="No workflows available" description="Create a workflow first to execute and inspect it here." />
            )}

            <div className="space-y-2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Run input</p>
              <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                rows={8}
                className="w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 font-mono text-xs outline-none"
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{selectedWorkflow?.name || 'Select a workflow'}</h2>
                  <p className="text-sm text-[var(--ui-text-muted)]">{selectedWorkflow?.description || 'Choose a workflow to inspect runs, status, and logs.'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={runWorkflow} disabled={!selectedWorkflowId || actionLoading}>
                    <Play size={16} /> Run now
                  </Button>
                  <Button variant="secondary" onClick={triggerWorkflow} disabled={!selectedWorkflowId || actionLoading}>
                    <TimerReset size={16} /> Trigger
                  </Button>
                  <Button variant="secondary" onClick={() => runAction(`/workflow/${selectedWorkflowId}/pause`, 'Paused')} disabled={!activeRun || actionLoading}>
                    <Pause size={16} /> Pause
                  </Button>
                  <Button variant="secondary" onClick={() => runAction(`/workflow/${selectedWorkflowId}/resume`, 'Resumed')} disabled={!activeRun || actionLoading}>
                    <Play size={16} /> Resume
                  </Button>
                  <Button variant="secondary" onClick={() => runAction(`/workflow/${selectedWorkflowId}/retry`, 'Retried')} disabled={!activeRun || actionLoading}>
                    <RotateCcw size={16} /> Retry
                  </Button>
                  <Button variant="danger" onClick={() => runAction(`/workflow/${selectedWorkflowId}/cancel`, 'Cancelled')} disabled={!activeRun || actionLoading}>
                    <Square size={16} /> Cancel
                  </Button>
                </div>
              </div>
              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Latest status</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge tone={statusTone[activeRun?.status] || 'default'}>{activeRun?.status || 'pending'}</Badge>
                    <span className="text-sm text-[var(--ui-text-muted)]">step {activeRun?.current_step ?? 0}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Trigger</p>
                  <p className="mt-2 text-sm font-medium">{activeRun?.trigger_type || selectedWorkflow?.trigger_type || 'manual'}</p>
                </div>
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Runs</p>
                  <p className="mt-2 text-sm font-medium">{runs.length} execution record{runs.length === 1 ? '' : 's'}</p>
                </div>
              </div>
            </Card>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Execution timeline</h3>
                  <Badge tone="accent">live logs</Badge>
                </div>
                {logs.length ? (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <article key={log.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge tone={statusTone[log.status] || 'default'}>{log.status}</Badge>
                            <span className="text-sm font-medium">{log.agent} · {log.action}</span>
                          </div>
                          <span className="text-xs text-[var(--ui-text-muted)]">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--ui-text-muted)]">{log.message}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No timeline yet" description="Execute a workflow to see the live step-by-step timeline." />
                )}
              </Card>

              <Card className="space-y-4">
                <h3 className="font-semibold">Run history</h3>
                {runs.length ? (
                  <div className="space-y-3">
                    {runs.map((run) => (
                      <div key={run.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge tone={statusTone[run.status] || 'default'}>{run.status}</Badge>
                          <span className="text-xs text-[var(--ui-text-muted)]">{new Date(run.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--ui-text-muted)]">Current step {run.current_step || 0}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Run history is empty" description="The latest execution will appear here once you run or trigger the workflow." />
                )}
              </Card>
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default WorkflowExecution;
