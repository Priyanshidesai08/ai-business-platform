import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Download, Plus, Save, Trash2, Eye, Workflow as WorkflowIcon } from 'lucide-react';

const emptyStep = { agent: 'sales', action: 'execute', input: {}, output: {}, retry: 0, timeout: 0, condition: '' };

const WorkflowCenter = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('manual');
  const [status, setStatus] = useState('draft');
  const [steps, setSteps] = useState([emptyStep]);
  const { pushToast } = useToast();

  const selected = useMemo(() => workflows.find((workflow) => workflow.id === selectedId) || null, [workflows, selectedId]);

  const load = useCallback(async () => {
    const { data } = await api.get('/workflow');
    setWorkflows(data.workflows || []);
    if (!selectedId && data.workflows?.length) setSelectedId(data.workflows[0].id);
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) return;
    setName(selected.name || '');
    setDescription(selected.description || '');
    setTriggerType(selected.trigger_type || 'manual');
    setStatus(selected.status || 'draft');
    setSteps(Array.isArray(selected.steps) ? selected.steps : JSON.parse(selected.steps || '[]'));
  }, [selected]);

  const save = async () => {
    const payload = { name, description, triggerType, status, steps };
    if (selected) {
      await api.put(`/workflow/${selected.id}`, payload);
      pushToast({ tone: 'success', title: 'Workflow updated', message: 'The workflow is now editable and saved.' });
    } else {
      const { data } = await api.post('/workflow', payload);
      setSelectedId(data.workflow.id);
      pushToast({ tone: 'success', title: 'Workflow saved', message: 'A new workflow was created.' });
    }
    await load();
  };

  const remove = async () => {
    if (!selected) return;
    await api.delete(`/workflow/${selected.id}`);
    setSelectedId('');
    setName('');
    setDescription('');
    setSteps([emptyStep]);
    await load();
    pushToast({ tone: 'info', title: 'Workflow deleted', message: 'The workflow was removed.' });
  };

  const exportWorkflow = () => {
    if (!selected) {
      pushToast({ tone: 'warning', title: 'Select a workflow first', message: 'Pick a workflow before exporting it.' });
      return;
    }
    const blob = new globalThis.Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selected.name || 'workflow'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => globalThis.URL.revokeObjectURL(url), 1000);
    pushToast({ tone: 'success', title: 'Workflow exported', message: 'Workflow definition downloaded.' });
  };

  const updateStep = (index, field, value) => {
    setSteps((current) => current.map((step, idx) => (idx === index ? { ...step, [field]: value } : step)));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Workflow Engine"
          title="Workflow Center"
          description="Create executable business workflows, inspect steps, and manage workflow definitions from one place."
          actions={<Badge tone="accent"><WorkflowIcon size={14} className="mr-2 inline" /> central engine</Badge>}
        />

        <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Workflows</h2>
              <Button variant="secondary" onClick={() => { setSelectedId(''); setName(''); setDescription(''); setSteps([emptyStep]); }}>
                <Plus size={16} /> New
              </Button>
            </div>
            <div className="space-y-2">
              {workflows.length ? workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => setSelectedId(workflow.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${selectedId === workflow.id ? 'border-[var(--ui-accent)] bg-blue-50/60' : 'border-[var(--ui-border)] bg-[var(--ui-surface-muted)] hover:bg-[var(--ui-surface-muted)]'}`}
                >
                  <p className="font-medium">{workflow.name}</p>
                  <p className="mt-1 text-xs text-[var(--ui-text-muted)]">{workflow.trigger_type} · {workflow.status}</p>
                </button>
              )) : <EmptyState title="No workflows yet" description="Create your first workflow to begin organizing agent execution." />}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <h2 className="font-semibold">Workflow editor</h2>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" />
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
              <div className="grid gap-3 md:grid-cols-3">
                <Input value={triggerType} onChange={(e) => setTriggerType(e.target.value)} placeholder="Trigger type" />
                <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status" />
                <Button variant="primary" onClick={save}><Save size={16} /> Save workflow</Button>
              </div>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <article key={`step-${index}`} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input value={step.agent} onChange={(e) => updateStep(index, 'agent', e.target.value)} placeholder="agent" />
                      <Input value={step.action} onChange={(e) => updateStep(index, 'action', e.target.value)} placeholder="action" />
                      <Input value={step.condition} onChange={(e) => updateStep(index, 'condition', e.target.value)} placeholder="condition" />
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <textarea value={JSON.stringify(step.input, null, 2)} onChange={(e) => updateStep(index, 'input', JSON.parse(e.target.value || '{}'))} rows={4} className="w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 font-mono text-xs outline-none" />
                      <textarea value={JSON.stringify(step.output, null, 2)} onChange={(e) => updateStep(index, 'output', JSON.parse(e.target.value || '{}'))} rows={4} className="w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 font-mono text-xs outline-none" />
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <Input type="number" value={step.retry} onChange={(e) => updateStep(index, 'retry', Number(e.target.value))} placeholder="retry" />
                      <Input type="number" value={step.timeout} onChange={(e) => updateStep(index, 'timeout', Number(e.target.value))} placeholder="timeout" />
                      <Button variant="secondary" onClick={() => setSteps((current) => [...current, emptyStep])}><Plus size={16} /> Add step</Button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={save}><Save size={16} /> Save</Button>
                <Button variant="secondary" onClick={exportWorkflow}><Download size={16} /> Export Workflow</Button>
                <Button variant="danger" onClick={remove}><Trash2 size={16} /> Delete</Button>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold"><Eye size={16} /> Workflow view</h2>
                <Badge tone="success">{selected?.status || 'draft'}</Badge>
              </div>
              {selected ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--ui-text-muted)]">{selected.description}</p>
                  <pre className="overflow-auto rounded-2xl bg-[var(--ui-surface-muted)] p-4 text-xs">{JSON.stringify(selected.steps, null, 2)}</pre>
                </div>
              ) : <EmptyState title="Select a workflow" description="Pick an item from the list to inspect its steps and definition." />}
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default WorkflowCenter;
