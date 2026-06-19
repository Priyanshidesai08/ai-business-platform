import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Check, Code2, Download, Import, Link2, Move, Save, Trash2, Workflow } from 'lucide-react';

const STORAGE_KEY = 'workflow-builder-state-v1';

const nodePalette = [
  { type: 'start', label: 'Start Node', color: '#2563eb' },
  { type: 'agent', label: 'Agent Node', color: '#0f9f8f' },
  { type: 'condition', label: 'Condition Node', color: '#f59e0b' },
  { type: 'delay', label: 'Delay Node', color: '#64748b' },
  { type: 'end', label: 'End Node', color: '#16a34a' }
];

const defaultState = {
  name: 'New workflow builder',
  description: 'Visual workflow drafted in the builder',
  nodes: [
    { id: 'start-1', type: 'start', label: 'Start', x: 80, y: 110, config: { agent: 'sales', action: 'start' } },
    { id: 'agent-1', type: 'agent', label: 'Sales Agent', x: 280, y: 110, config: { agent: 'sales', action: 'qualify' } },
    { id: 'end-1', type: 'end', label: 'End', x: 500, y: 110, config: { agent: 'workflow', action: 'complete' } }
  ],
  edges: [
    { id: 'edge-1', from: 'start-1', to: 'agent-1' },
    { id: 'edge-2', from: 'agent-1', to: 'end-1' }
  ]
};

const getStoredState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState;
  } catch {
    return defaultState;
  }
};

const WorkflowBuilder = () => {
  const [builder, setBuilder] = useState(getStoredState);
  const [selectedId, setSelectedId] = useState(builder.nodes[0]?.id || '');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragNode, setDragNode] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [edgeGuide, setEdgeGuide] = useState('');
  const canvasRef = useRef(null);
  const { pushToast } = useToast();

  const selectedNode = useMemo(() => builder.nodes.find((node) => node.id === selectedId) || null, [builder.nodes, selectedId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builder));
  }, [builder]);

  const updateNode = (nodeId, patch) => {
    setBuilder((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node))
    }));
  };

  const addNode = (type, position = { x: 100, y: 100 }) => {
    const label = nodePalette.find((item) => item.type === type)?.label || type;
    const nextId = `${type}-${Date.now()}`;
    setBuilder((current) => ({
      ...current,
      nodes: [...current.nodes, { id: nextId, type, label, x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20, config: { agent: type === 'agent' ? 'sales' : 'workflow', action: type } }]
    }));
    setSelectedId(nextId);
  };

  const removeNode = (nodeId) => {
    setBuilder((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== nodeId),
      edges: current.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId)
    }));
    setSelectedId((current) => (current === nodeId ? '' : current));
  };

  const connectNodes = (toId) => {
    if (!connectingFrom || connectingFrom === toId) {
      setConnectingFrom(toId);
      setEdgeGuide(`Selected ${builder.nodes.find((node) => node.id === toId)?.label || 'node'} as source`);
      return;
    }
    setBuilder((current) => ({
      ...current,
      edges: [...current.edges.filter((edge) => !(edge.from === connectingFrom && edge.to === toId)), { id: `edge-${Date.now()}`, from: connectingFrom, to: toId }]
    }));
    setConnectingFrom('');
    setEdgeGuide('Connection created');
  };

  const validateFlow = () => {
    const hasStart = builder.nodes.some((node) => node.type === 'start');
    const hasEnd = builder.nodes.some((node) => node.type === 'end');
    const valid = hasStart && hasEnd && builder.edges.length >= 1;
    pushToast({
      tone: valid ? 'success' : 'warning',
      title: valid ? 'Flow valid' : 'Flow needs work',
      message: valid ? 'Your workflow has the required start and end nodes.' : 'Add a start node, an end node, and at least one connection.'
    });
    return valid;
  };

  const buildWorkflowPayload = useCallback(() => ({
    name: builder.name,
    description: builder.description,
    triggerType: 'manual',
    status: 'draft',
    steps: builder.nodes
      .filter((node) => node.type !== 'start' && node.type !== 'end')
      .map((node, index) => ({
        agent: node.config.agent || 'sales',
        action: node.config.action || node.type,
        input: { nodeId: node.id, position: { x: node.x, y: node.y }, index },
        output: {},
        retry: 0,
        timeout: node.type === 'delay' ? 30000 : 0,
        condition: node.type === 'condition' ? node.config.condition || 'conditional' : ''
      }))
  }), [builder.description, builder.name, builder.nodes]);

  const saveWorkflow = async () => {
    if (!validateFlow()) return;
    const payload = buildWorkflowPayload();
    try {
      const existing = builder.workflowId;
      const response = existing
        ? await api.put(`/workflow/${existing}`, payload)
        : await api.post('/workflow', payload);
      const workflow = response.data.workflow;
      setBuilder((current) => ({ ...current, workflowId: workflow.id }));
      pushToast({ tone: 'success', title: 'Workflow saved', message: 'The visual builder state is now stored in the backend.' });
    } catch (error) {
      pushToast({ tone: 'danger', title: 'Save failed', message: error.response?.data?.message || error.message || 'Could not save workflow.' });
    }
  };

  const exportWorkflow = () => {
    const blob = new Blob([JSON.stringify(builder, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workflow-builder.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importWorkflow = () => {
    try {
      const parsed = JSON.parse(importText);
      setBuilder(parsed);
      setSelectedId(parsed.nodes?.[0]?.id || '');
      pushToast({ tone: 'success', title: 'Workflow imported', message: 'Builder state was restored from JSON.' });
    } catch {
      pushToast({ tone: 'danger', title: 'Import failed', message: 'The pasted JSON could not be parsed.' });
    }
  };

  const previewSteps = useMemo(() => buildWorkflowPayload().steps, [buildWorkflowPayload]);
  const miniMapNodes = useMemo(() => builder.nodes.map((node) => ({
    ...node,
    x: Math.max(8, (node.x / 6)),
    y: Math.max(8, (node.y / 6))
  })), [builder.nodes]);

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Workflow builder"
          title="Visual Builder"
          description="Drag nodes onto the canvas, connect them into a workflow, validate the flow, and save it directly to the workflow engine."
          actions={<Badge tone="accent"><Workflow size={14} className="mr-2 inline" /> visual automation</Badge>}
        />

        <section className="grid gap-6 xl:grid-cols-[260px_1fr_320px]">
          <Card className="space-y-4">
            <h2 className="font-semibold">Node palette</h2>
            <div className="space-y-2">
              {nodePalette.map((item) => (
                <button
                  key={item.type}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('node-type', item.type)}
                  className="flex w-full items-center justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-3 text-left"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <Move size={15} className="text-[var(--ui-text-muted)]" />
                </button>
              ))}
            </div>
            <div className="space-y-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
              <Input value={builder.name} onChange={(e) => setBuilder((current) => ({ ...current, name: e.target.value }))} placeholder="Workflow name" />
              <Input value={builder.description} onChange={(e) => setBuilder((current) => ({ ...current, description: e.target.value }))} placeholder="Description" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={validateFlow}><Check size={16} /> Validate</Button>
              <Button variant="secondary" onClick={exportWorkflow}><Download size={16} /> Export</Button>
              <Button variant="secondary" onClick={() => setPreviewOpen(true)}><Code2 size={16} /> Preview</Button>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-sm font-semibold">
                <Import size={16} /> Import
                <input type="file" accept="application/json" className="hidden" onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  setImportText(text);
                }} />
              </label>
            </div>
            {importText ? <Button variant="primary" onClick={importWorkflow}><Import size={16} /> Apply imported state</Button> : null}
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Canvas</h2>
                <p className="text-sm text-[var(--ui-text-muted)]">Drop nodes here, connect them, and drag to reposition.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setZoom((current) => Math.max(0.6, current - 0.1))}>-</Button>
                <Button variant="secondary" onClick={() => setZoom(1)}>100%</Button>
                <Button variant="secondary" onClick={() => setZoom((current) => Math.min(1.6, current + 0.1))}>+</Button>
                <Button variant="primary" onClick={saveWorkflow}><Save size={16} /> Save builder state</Button>
              </div>
            </div>

            <div
              ref={canvasRef}
              className="relative min-h-[560px] overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const type = event.dataTransfer.getData('node-type');
                if (!type) return;
                const rect = canvasRef.current?.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / zoom) - pan.x;
                const y = ((event.clientY - rect.top) / zoom) - pan.y;
                addNode(type, { x, y });
              }}
              onWheel={(event) => {
                if (!event.ctrlKey) return;
                event.preventDefault();
                setZoom((current) => Math.min(1.8, Math.max(0.6, current + (event.deltaY > 0 ? -0.05 : 0.05))));
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.14)_1px,transparent_0)] [background-size:20px_20px] opacity-60" />
              <div
                className="absolute inset-0 cursor-grab"
                onMouseDown={(event) => {
                  const start = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
                  const onMove = (moveEvent) => {
                    setPan({
                      x: start.panX + (moveEvent.clientX - start.x),
                      y: start.panY + (moveEvent.clientY - start.y)
                    });
                  };
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
              />
              <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }} className="absolute inset-0">
                <svg className="absolute inset-0 h-full w-full">
                  {builder.edges.map((edge) => {
                    const from = builder.nodes.find((node) => node.id === edge.from);
                    const to = builder.nodes.find((node) => node.id === edge.to);
                    if (!from || !to) return null;
                    return <line key={edge.id} x1={from.x + 120} y1={from.y + 42} x2={to.x} y2={to.y + 42} stroke="rgba(37,99,235,0.5)" strokeWidth="3" markerEnd="url(#arrowhead)" />;
                  })}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="rgba(37,99,235,0.7)" />
                    </marker>
                  </defs>
                </svg>
                  {builder.nodes.map((node) => {
                    const palette = nodePalette.find((item) => item.type === node.type);
                    const isSelected = selectedId === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedId(node.id)}
                        onDoubleClick={() => connectNodes(node.id)}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          setDragNode(node.id);
                        }}
                        onMouseUp={() => setDragNode(null)}
                        className={`absolute w-[220px] rounded-3xl border px-4 py-4 text-left shadow-lg transition ${isSelected ? 'border-[var(--ui-accent)] bg-white' : 'border-[var(--ui-border)] bg-[var(--ui-surface)]'} ${connectingFrom === node.id ? 'ring-2 ring-blue-300' : ''}`}
                        style={{ left: node.x, top: node.y }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 font-semibold">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette?.color || '#2563eb' }} />
                            {node.label}
                          </span>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={(event) => { event.stopPropagation(); connectNodes(node.id); }} className="rounded-full p-1 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]" aria-label={`Connect ${node.label}`}>
                              <Link2 size={14} />
                            </button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); removeNode(node.id); }} className="rounded-full p-1 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]" aria-label={`Delete ${node.label}`}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-[var(--ui-text-muted)]">Type: {node.type}</p>
                        <p className="mt-1 text-xs text-[var(--ui-text-muted)]">Use the chain icon or double click another node to connect.</p>
                      </button>
                    );
                  })}
              </div>
              {dragNode ? (
                <div
                  className="absolute inset-0"
                  onPointerMove={(event) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    const x = ((event.clientX - rect.left) / zoom) - pan.x;
                    const y = ((event.clientY - rect.top) / zoom) - pan.y;
                    setBuilder((current) => ({
                      ...current,
                      nodes: current.nodes.map((node) => (node.id === dragNode ? { ...node, x: Math.max(20, Math.round(x / 20) * 20), y: Math.max(20, Math.round(y / 20) * 20) } : node))
                    }));
                  }}
                  onPointerUp={() => setDragNode(null)}
                />
              ) : null}
              <div className="absolute bottom-4 right-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 shadow-lg">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Mini map</p>
                <div className="relative mt-2 h-28 w-40 rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-muted)]">
                  {miniMapNodes.map((node) => (
                    <span
                      key={node.id}
                      className="absolute h-2.5 w-2.5 rounded-full bg-[var(--ui-accent)]"
                      style={{ left: `${node.x}px`, top: `${node.y}px`, opacity: node.type === 'start' ? 1 : 0.8 }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3 text-sm text-[var(--ui-text-muted)]">
              {edgeGuide || 'Drag from the palette, then connect nodes using the chain icon for a quick flow-building loop.'}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <h2 className="font-semibold">Properties panel</h2>
              {selectedNode ? (
                <div className="space-y-3">
                  <Input value={selectedNode.label} onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })} placeholder="Node label" />
                  <Input value={selectedNode.config.agent || ''} onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, agent: e.target.value } })} placeholder="Agent" />
                  <Input value={selectedNode.config.action || ''} onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, action: e.target.value } })} placeholder="Action" />
                  <Input value={selectedNode.config.condition || ''} onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.config, condition: e.target.value } })} placeholder="Condition" />
                </div>
              ) : (
                <EmptyState title="No node selected" description="Pick a node to edit its properties here." />
              )}
            </Card>

            <Card className="space-y-4">
              <h2 className="font-semibold">Preview</h2>
              {previewSteps.length ? (
                <div className="space-y-3">
                  {previewSteps.map((step, index) => (
                    <div key={`${step.agent}-${index}`} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{step.agent}</span>
                        <Badge tone="accent">{step.action}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-[var(--ui-text-muted)]">{step.condition || 'No condition'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No executable steps" description="Add agent or delay nodes to generate a workflow preview." />
              )}
            </Card>
          </div>
        </section>

        <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Workflow JSON preview">
          <pre className="max-h-[65vh] overflow-auto rounded-2xl bg-[var(--ui-surface-muted)] p-4 text-xs">{JSON.stringify(buildWorkflowPayload(), null, 2)}</pre>
        </Modal>
      </div>
    </AppShell>
  );
};

export default WorkflowBuilder;
