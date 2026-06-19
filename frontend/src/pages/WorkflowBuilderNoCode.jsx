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
import { Check, Copy, Download, Layers3, Link2, Move, RotateCcw, Save, Trash2, Workflow } from 'lucide-react';
import {
  connectNodes,
  canConnectNodes,
  createNode,
  deleteNode,
  duplicateNode,
  exportBuilderState,
  importBuilderState,
  nodeTypes,
  renameNode,
  restoreBuilderState,
  saveBuilderState,
  validateConnections,
  validateFlow
} from '../workflow-builder/nodeEngine.js';

const initialState = {
  name: 'No-code flow',
  description: 'Build automation visually',
  nodes: [
    createNode('trigger', { x: 90, y: 120 }, { label: 'New lead' }),
    createNode('agent', { x: 300, y: 120 }, { label: 'Sales agent' }),
    createNode('end', { x: 520, y: 120 }, { label: 'Complete' })
  ],
  edges: []
};

initialState.edges = connectNodes(initialState.edges, initialState.nodes[0].id, initialState.nodes[1].id);
initialState.edges = connectNodes(initialState.edges, initialState.nodes[1].id, initialState.nodes[2].id);

const WorkflowBuilderNoCode = () => {
  const [state, setState] = useState(() => restoreBuilderState() || initialState);
  const [selectedId, setSelectedId] = useState(state.nodes[0]?.id || '');
  const [draggingId, setDraggingId] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [canvasMessage, setCanvasMessage] = useState('Drag, drop, zoom, pan, and connect nodes.');
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [loadingSavedWorkflows, setLoadingSavedWorkflows] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState('');
  const [executionState, setExecutionState] = useState({ status: 'pending', logs: [], runs: [], runId: '' });
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const clipboardRef = useRef(null);
  const canvasRef = useRef(null);
  const { pushToast } = useToast();
  const [selectedIds, setSelectedIds] = useState([state.nodes[0]?.id || '']);
  const [selectionBox, setSelectionBox] = useState(null);
  const [alignmentGuides, setAlignmentGuides] = useState([]);

  const selectedNode = useMemo(() => state.nodes.find((node) => node.id === selectedId) || null, [state.nodes, selectedId]);
  const selectedNodes = useMemo(() => state.nodes.filter((node) => selectedIds.includes(node.id)), [state.nodes, selectedIds]);
  const flowValid = useMemo(() => validateFlow(state.nodes, state.edges), [state.edges, state.nodes]);
  const connectionValidation = useMemo(() => validateConnections(state.nodes, state.edges), [state.edges, state.nodes]);

  useEffect(() => {
    saveBuilderState(state);
  }, [state]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault();
          copyNode();
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault();
          pasteNode();
        }
      }
      if (!event.metaKey && !event.ctrlKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const step = event.shiftKey ? 20 : 4;
        const deltas = {
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0]
        };
        const [dx, dy] = deltas[event.key];
        moveSelectedNodes(dx, dy);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [copyNode, moveSelectedNodes, pasteNode, redo, undo]);

  useEffect(() => {
    const loadSavedWorkflows = async () => {
      setLoadingSavedWorkflows(true);
      try {
        const response = await api.get('/builder/workflow');
        const workflows = response.data?.workflows || [];
        setSavedWorkflows(workflows);
        if (!activeWorkflowId && workflows[0]?.id) {
          setActiveWorkflowId(workflows[0].id);
        }
      } catch (error) {
        pushToast({
          tone: 'warning',
          title: 'Backend save service unavailable',
          message: error.response?.data?.message || 'The builder will keep using local storage until the backend is reachable.'
        });
      } finally {
        setLoadingSavedWorkflows(false);
      }
    };

    loadSavedWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncState = (patch) => setState((current) => ({ ...current, ...patch }));

  const pushState = useCallback((updater) => {
    setState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      setHistory((entries) => [...entries, current].slice(-30));
      setFuture([]);
      return next;
    });
  }, []);

  const addNode = (type, position) => {
    const node = createNode(type, position, { label: `${type} node` });
    pushState((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedId(node.id);
    setSelectedIds([node.id]);
    setCanvasMessage(`${node.type} added to the canvas.`);
  };

  const onCanvasDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('node-type');
    if (!type) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const position = {
      x: ((event.clientX - rect.left) / zoom) - pan.x,
      y: ((event.clientY - rect.top) / zoom) - pan.y
    };
    addNode(type, position);
  };

  const getNodeBounds = (node) => ({
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + 220,
    bottom: node.position.y + 88
  });

  const commitSelectionBox = (box) => {
    if (!box) return;
    const rect = {
      left: Math.min(box.startX, box.endX),
      right: Math.max(box.startX, box.endX),
      top: Math.min(box.startY, box.endY),
      bottom: Math.max(box.startY, box.endY)
    };
    const selected = state.nodes
      .filter((node) => {
        const bounds = getNodeBounds(node);
        return bounds.left < rect.right && bounds.right > rect.left && bounds.top < rect.bottom && bounds.bottom > rect.top;
      })
      .map((node) => node.id);
    if (selected.length) {
      setSelectedIds(selected);
      setSelectedId(selected[0]);
      setCanvasMessage(`${selected.length} node${selected.length === 1 ? '' : 's'} selected.`);
    }
  };

  const updateSelected = (patch) => {
    if (!selectedNode) return;
    pushState((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === selectedNode.id ? { ...node, config: { ...node.config, ...patch } } : node))
    }));
  };

  const removeSelected = () => {
    if (!selectedNodes.length) return;
    const next = selectedNodes.reduce((acc, node) => deleteNode(acc.nodes, acc.edges, node.id), { nodes: state.nodes, edges: state.edges });
    pushState((current) => ({ ...current, ...next }));
    setSelectedId(next.nodes[0]?.id || '');
    setSelectedIds(next.nodes[0]?.id ? [next.nodes[0].id] : []);
  };

  const duplicateSelected = () => {
    if (!selectedNodes.length) return;
    let nodes = state.nodes;
    for (const node of selectedNodes) {
      nodes = duplicateNode(nodes, node.id);
    }
    pushState((current) => ({ ...current, nodes }));
    setCanvasMessage('Node duplicated.');
  };

  const save = async () => {
    saveBuilderState(state);
    const payload = {
      name: state.name,
      description: state.description,
      nodes: state.nodes,
      edges: state.edges
    };

    try {
      const response = activeWorkflowId
        ? await api.put(`/builder/workflow/${activeWorkflowId}`, payload)
        : await api.post('/builder/workflow', payload);
      const workflow = response.data?.workflow;
      if (workflow?.id) {
        setActiveWorkflowId(workflow.id);
      }
      const refreshed = await api.get('/builder/workflow');
      setSavedWorkflows(refreshed.data?.workflows || []);
      pushToast({ tone: 'success', title: 'Builder saved', message: 'The workflow is now saved in the backend and local storage.' });
    } catch (error) {
      console.error('Builder save failed', error);
      pushToast({
        tone: 'danger',
        title: 'Save failed',
        message: error.response?.data?.message || 'Could not save the workflow.'
      });
    }
  };

  const loadSavedWorkflow = async (workflowId) => {
    if (!workflowId) return;
    try {
      const response = await api.get(`/builder/workflow/${workflowId}`);
      const workflow = response.data?.workflow;
      if (!workflow) return;
      const nextState = {
        name: workflow.name || 'No-code flow',
        description: workflow.description || '',
        nodes: workflow.nodes || [],
        edges: workflow.edges || []
      };
      pushState(nextState);
      setSelectedId(nextState.nodes[0]?.id || '');
      setSelectedIds(nextState.nodes[0]?.id ? [nextState.nodes[0].id] : []);
      setActiveWorkflowId(workflow.id);
      saveBuilderState(nextState);
      pushToast({ tone: 'success', title: 'Workflow loaded', message: 'Nodes and connections were restored from the backend.' });
    } catch (error) {
      pushToast({
        tone: 'danger',
        title: 'Load failed',
        message: error.response?.data?.message || 'Could not load the selected workflow.'
      });
    }
  };

  const deleteSavedWorkflow = async (workflowId) => {
    try {
      await api.delete(`/builder/workflow/${workflowId}`);
      setSavedWorkflows((current) => current.filter((workflow) => workflow.id !== workflowId));
      if (activeWorkflowId === workflowId) {
        setActiveWorkflowId('');
      }
      pushToast({ tone: 'success', title: 'Workflow deleted', message: 'The saved workflow was removed.' });
    } catch (error) {
      pushToast({
        tone: 'danger',
        title: 'Delete failed',
        message: error.response?.data?.message || 'Could not delete the workflow.'
      });
    }
  };

  const refreshExecution = async (workflowId = activeWorkflowId || savedWorkflows[0]?.id) => {
    if (!workflowId) return;
    try {
      const [statusRes, runsRes] = await Promise.all([
        api.get('/builder/status', { params: { workflowId } }),
        api.get('/builder/runs', { params: { workflowId } })
      ]);
      const currentRunId = statusRes.data?.workflowStatus?.id || runsRes.data?.runs?.[0]?.id || '';
      const logsRes = currentRunId ? await api.get('/builder/logs', { params: { workflowId, runId: currentRunId } }) : { data: { logs: [] } };
      setExecutionState({
        status: statusRes.data?.workflowStatus?.status || 'pending',
        runs: runsRes.data?.runs || [],
        logs: logsRes.data?.logs || [],
        runId: currentRunId
      });
    } catch (error) {
      console.error('Execution refresh failed', error);
    }
  };

  const runWorkflow = async () => {
    const workflowId = activeWorkflowId || savedWorkflows[0]?.id;
    if (!workflowId) return;
    const response = await api.post('/builder/run', { workflowId, input: { from: 'builder' }, triggerType: 'manual' });
    setExecutionState((current) => ({ ...current, status: response.data?.status || 'running', runId: response.data?.run?.id || current.runId }));
    await refreshExecution(workflowId);
  };

  const updateRunState = async (path) => {
    const workflowId = activeWorkflowId || savedWorkflows[0]?.id;
    if (!workflowId) return;
    await api.post(`/builder/${path}`, { workflowId });
    await refreshExecution(workflowId);
  };

  useEffect(() => {
    if (activeWorkflowId) {
      refreshExecution(activeWorkflowId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkflowId]);

  const exportJson = () => {
    const blob = new Blob([exportBuilderState(state)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'no-code-workflow.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const undo = useCallback(() => {
    setHistory((entries) => {
      if (!entries.length) return entries;
      const previous = entries[entries.length - 1];
      setFuture((items) => [state, ...items].slice(0, 30));
      setState(previous);
      setSelectedIds(previous.nodes?.[0]?.id ? [previous.nodes[0].id] : []);
      return entries.slice(0, -1);
    });
  }, [state]);

  const redo = useCallback(() => {
    setFuture((items) => {
      if (!items.length) return items;
      const [next, ...rest] = items;
      setHistory((entries) => [...entries, state].slice(-30));
      setState(next);
      setSelectedIds(next.nodes?.[0]?.id ? [next.nodes[0].id] : []);
      return rest;
    });
  }, [state]);

  const copyNode = useCallback(() => {
    if (!selectedNode) return;
    clipboardRef.current = selectedNode;
    pushToast({ tone: 'success', title: 'Copied', message: 'Selected node copied to clipboard buffer.' });
  }, [pushToast, selectedNode]);

  const pasteNode = useCallback(() => {
    const source = clipboardRef.current;
    if (!source) return;
    const copy = duplicateNode(state.nodes, source.id);
    pushState((current) => ({ ...current, nodes: copy }));
    pushToast({ tone: 'success', title: 'Pasted', message: 'Node duplicated from clipboard buffer.' });
  }, [pushState, pushToast, state.nodes]);

  const moveSelectedNodes = useCallback((dx, dy) => {
    if (!selectedNodes.length) return;
    pushState((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (
        selectedIds.includes(node.id)
          ? { ...node, position: { x: Math.max(20, node.position.x + dx), y: Math.max(20, node.position.y + dy) } }
          : node
      ))
    }));
    setAlignmentGuides([]);
  }, [pushState, selectedIds, selectedNodes.length]);

  const setDragGuides = (nodeId, position) => {
    const movedNode = state.nodes.find((node) => node.id === nodeId);
    if (!movedNode) return;
    const centerX = position.x + 110;
    const centerY = position.y + 44;
    const guides = [];
    for (const node of state.nodes) {
      if (node.id === nodeId) continue;
      const otherCenterX = node.position.x + 110;
      const otherCenterY = node.position.y + 44;
      if (Math.abs(centerX - otherCenterX) <= 8) {
        guides.push({ type: 'vertical', left: otherCenterX });
      }
      if (Math.abs(centerY - otherCenterY) <= 8) {
        guides.push({ type: 'horizontal', top: otherCenterY });
      }
      if (Math.abs(position.x - node.position.x) <= 8) {
        guides.push({ type: 'vertical', left: node.position.x });
      }
      if (Math.abs(position.y - node.position.y) <= 8) {
        guides.push({ type: 'horizontal', top: node.position.y });
      }
    }
    setAlignmentGuides(guides.slice(0, 4));
  };

  const clearDragGuides = () => setAlignmentGuides([]);

  const buildPreview = useMemo(() => state.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    config: node.config
  })), [state.nodes]);

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="No-code builder"
          title="Workflow Builder"
          description="Create automation visually with a responsive canvas, node library, and local save/restore state."
          actions={<Badge tone="accent"><Workflow size={14} className="mr-2 inline" /> canvas builder</Badge>}
        />

        <section className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Node Library</h2>
              <Layers3 size={16} className="text-[var(--ui-text-muted)]" />
            </div>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => (
                <button
                  key={nodeType.type}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('node-type', nodeType.type)}
                  onClick={() => addNode(nodeType.type, { x: 100, y: 100 })}
                  className="flex w-full items-center justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-3 text-left"
                >
                  <span>{nodeType.label}</span>
                  <Move size={14} className="text-[var(--ui-text-muted)]" />
                </button>
              ))}
            </div>
            <Input value={state.name} onChange={(e) => syncState({ name: e.target.value })} placeholder="Workflow name" />
            <Input value={state.description} onChange={(e) => syncState({ description: e.target.value })} placeholder="Description" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setState(restoreBuilderState() || initialState)}><RotateCcw size={16} /> Restore</Button>
              <Button variant="secondary" onClick={exportJson}><Download size={16} /> Export</Button>
              <Button variant="secondary" onClick={undo} disabled={!history.length}><RotateCcw size={16} /> Undo</Button>
              <Button variant="secondary" onClick={redo} disabled={!future.length}><RotateCcw size={16} /> Redo</Button>
            </div>
            <div className="space-y-2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Import JSON</p>
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 font-mono text-xs outline-none"
                placeholder="Paste exported workflow JSON"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  try {
                    const next = importBuilderState(importText);
                    setState(next);
                    setSelectedId(next.nodes?.[0]?.id || '');
                    pushToast({ tone: 'success', title: 'Imported', message: 'Workflow builder state restored.' });
                  } catch {
                    pushToast({ tone: 'danger', title: 'Import failed', message: 'The pasted JSON could not be read.' });
                  }
                }}
              >
                <Save size={16} /> Apply import
              </Button>
            </div>
            <div className="space-y-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Saved workflows</p>
                <Badge tone="neutral">{loadingSavedWorkflows ? 'Loading' : `${savedWorkflows.length}`}</Badge>
              </div>
              <div className="space-y-2">
                {savedWorkflows.length ? savedWorkflows.map((workflow) => (
                  <div key={workflow.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" className="text-left" onClick={() => loadSavedWorkflow(workflow.id)}>
                        <p className="font-medium">{workflow.name}</p>
                        <p className="text-xs text-[var(--ui-text-muted)]">{workflow.description || 'No description'}</p>
                      </button>
                      <Button variant="ghost" onClick={() => deleteSavedWorkflow(workflow.id)}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                )) : <EmptyState title="No saved workflows" description="Save one from the canvas and it will appear here." />}
              </div>
            </div>
            <Button variant="primary" onClick={save}><Save size={16} /> Save workflow</Button>
            <Button variant="secondary" onClick={() => loadSavedWorkflow(activeWorkflowId || savedWorkflows[0]?.id)} disabled={!activeWorkflowId && !savedWorkflows.length}>
              <Workflow size={16} /> Load workflow
            </Button>
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Canvas</h2>
                <p className="text-sm text-[var(--ui-text-muted)]">Drag nodes, pan the board, and zoom without leaving the page.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setZoom((current) => Math.max(0.6, current - 0.1))}>-</Button>
                <Button variant="secondary" onClick={() => setZoom(1)}>100%</Button>
                <Button variant="secondary" onClick={() => setZoom((current) => Math.min(1.6, current + 0.1))}>+</Button>
              </div>
            </div>

            <div
              ref={canvasRef}
              className="relative min-h-[560px] overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]"
              onDrop={onCanvasDrop}
              onDragOver={(event) => event.preventDefault()}
              onWheel={(event) => {
                if (!event.ctrlKey) return;
                event.preventDefault();
                setZoom((current) => Math.min(1.8, Math.max(0.6, current + (event.deltaY > 0 ? -0.05 : 0.05))));
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.16)_1px,transparent_0)] [background-size:20px_20px] opacity-70" />
              <div
                className="absolute inset-0"
                onPointerDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  const rect = canvasRef.current?.getBoundingClientRect();
                  const start = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
                  if (event.shiftKey || event.ctrlKey || event.metaKey) {
                    const box = { startX: event.clientX - rect.left, startY: event.clientY - rect.top, endX: event.clientX - rect.left, endY: event.clientY - rect.top };
                    setSelectionBox(box);
                    const onMove = (moveEvent) => {
                      box.endX = moveEvent.clientX - rect.left;
                      box.endY = moveEvent.clientY - rect.top;
                      setSelectionBox({ ...box });
                    };
                    const onUp = () => {
                      window.removeEventListener('pointermove', onMove);
                      window.removeEventListener('pointerup', onUp);
                      commitSelectionBox(box);
                      setSelectionBox(null);
                    };
                    window.addEventListener('pointermove', onMove);
                    window.addEventListener('pointerup', onUp);
                    return;
                  }
                  const onMove = (moveEvent) => setPan({
                    x: start.panX + (moveEvent.clientX - start.x),
                    y: start.panY + (moveEvent.clientY - start.y)
                  });
                  const onUp = () => {
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
                  };
                  window.addEventListener('pointermove', onMove);
                  window.addEventListener('pointerup', onUp);
                }}
              />
              {selectionBox ? (
                <div
                  className="pointer-events-none absolute border border-dashed border-[var(--ui-accent)] bg-[var(--ui-accent)]/10"
                  style={{
                    left: Math.min(selectionBox.startX, selectionBox.endX),
                    top: Math.min(selectionBox.startY, selectionBox.endY),
                    width: Math.abs(selectionBox.endX - selectionBox.startX),
                    height: Math.abs(selectionBox.endY - selectionBox.startY)
                  }}
                />
              ) : null}
              <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }} className="absolute inset-0">
                {draggingId ? (
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--ui-accent)]/20" />
                    <div className="absolute top-1/2 left-0 h-px w-full bg-[var(--ui-accent)]/20" />
                  </div>
                ) : null}
                {alignmentGuides.map((guide, index) => (
                  <div
                    key={`${guide.type}-${guide.left || guide.top}-${index}`}
                    className="pointer-events-none absolute z-10"
                    style={guide.type === 'vertical'
                      ? { left: `${guide.left}px`, top: 0, bottom: 0, width: 0 }
                      : { top: `${guide.top}px`, left: 0, right: 0, height: 0 }}
                  >
                    <div className={guide.type === 'vertical' ? 'h-full w-px bg-emerald-500/70 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]' : 'h-px w-full bg-emerald-500/70 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]'} />
                  </div>
                ))}
                <svg className="absolute inset-0 h-full w-full">
                  {state.edges.map((edge) => {
                    const from = state.nodes.find((node) => node.id === edge.from);
                    const to = state.nodes.find((node) => node.id === edge.to);
                    if (!from || !to) return null;
                    return <line key={edge.id} x1={from.position.x + 110} y1={from.position.y + 40} x2={to.position.x} y2={to.position.y + 40} stroke="rgba(37,99,235,0.45)" strokeWidth="3" markerEnd="url(#builder-arrow)" />;
                  })}
                  <defs>
                    <marker id="builder-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="rgba(37,99,235,0.75)" />
                    </marker>
                  </defs>
                </svg>
                {state.nodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    className={`absolute w-[220px] rounded-3xl border px-4 py-4 text-left shadow-lg transition ${selectedIds.includes(node.id) ? 'border-[var(--ui-accent)] bg-white' : 'border-[var(--ui-border)] bg-[var(--ui-surface)]'} ${draggingId === node.id ? 'ring-2 ring-[var(--ui-accent)]/40' : ''}`}
                    style={{ left: node.position.x, top: node.position.y }}
                    onClick={(event) => {
                      if (event.shiftKey || event.ctrlKey || event.metaKey) {
                        setSelectedIds((current) => current.includes(node.id) ? current.filter((id) => id !== node.id) : [...current, node.id]);
                      } else {
                        setSelectedIds([node.id]);
                      }
                      setSelectedId(node.id);
                    }}
                    onDoubleClick={() => {
                      const fromId = selectedId || node.id;
                      if (!canConnectNodes(state.nodes, fromId, node.id)) {
                        pushToast({ tone: 'warning', title: 'Invalid link', message: 'That connection is not allowed.' });
                        return;
                      }
                      setState((current) => ({ ...current, edges: connectNodes(current.edges, fromId, node.id) }));
                    }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setDraggingId(node.id);
                      setAlignmentGuides([]);
                    }}
                    onPointerUp={() => {
                      setDraggingId('');
                      clearDragGuides();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{node.config.label || node.type}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" className="rounded-full p-1 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]" onClick={(event) => { event.stopPropagation(); const fromId = selectedId || node.id; if (!canConnectNodes(state.nodes, fromId, node.id)) { pushToast({ tone: 'warning', title: 'Invalid link', message: 'That connection is not allowed.' }); return; } setState((current) => ({ ...current, edges: connectNodes(current.edges, fromId, node.id) })); }} aria-label={`Connect ${node.config.label || node.type}`}>
                          <Link2 size={14} />
                        </button>
                        <button type="button" className="rounded-full p-1 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]" onClick={(event) => { event.stopPropagation(); duplicateSelected(); }} aria-label={`Duplicate ${node.config.label || node.type}`}>
                          <Copy size={14} />
                        </button>
                        <button type="button" className="rounded-full p-1 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]" onClick={(event) => { event.stopPropagation(); const next = deleteNode(state.nodes, state.edges, node.id); setState((current) => ({ ...current, ...next })); setSelectedIds(next.nodes[0]?.id ? [next.nodes[0].id] : []); }} aria-label={`Delete ${node.config.label || node.type}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[var(--ui-text-muted)]">Type: {node.type}</p>
                    <p className="mt-1 text-xs text-[var(--ui-text-muted)]">Position: {node.position.x}, {node.position.y}</p>
                  </button>
                ))}
                {draggingId ? (
                  <div
                    className="absolute inset-0"
                    onPointerMove={(event) => {
                      const rect = canvasRef.current?.getBoundingClientRect();
                      const next = {
                        x: ((event.clientX - rect.left) / zoom) - pan.x,
                        y: ((event.clientY - rect.top) / zoom) - pan.y
                      };
                      const snapped = {
                        x: Math.max(20, Math.round(next.x / 20) * 20),
                        y: Math.max(20, Math.round(next.y / 20) * 20)
                      };
                      setState((current) => ({ ...current, nodes: current.nodes.map((node) => (node.id === draggingId ? { ...node, position: snapped } : node)) }));
                      setDragGuides(draggingId, snapped);
                    }}
                    onPointerUp={() => {
                      setDraggingId('');
                      clearDragGuides();
                    }}
                  />
                ) : null}
              </div>
            </div>
            {alignmentGuides.length ? (
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">Alignment guides</h3>
                  <Badge tone="neutral">{alignmentGuides.length}</Badge>
                </div>
                <div className="space-y-2">
                  {alignmentGuides.map((guide, index) => (
                    <div key={`${guide.type}-${guide.left || guide.top}-${index}`} className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      {guide.type === 'vertical' ? `Snap line at x=${Math.round(guide.left)}` : `Snap line at y=${Math.round(guide.top)}`}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3 text-xs text-[var(--ui-text-muted)]">
              {connectionValidation.valid ? 'Connections valid' : connectionValidation.issues.join(' · ')}
            </div>
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3 text-sm text-[var(--ui-text-muted)]">
              {canvasMessage}
            </div>
            <div className="space-y-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">Execution console</h3>
                <Badge tone={executionState.status === 'completed' ? 'success' : executionState.status === 'failed' ? 'danger' : 'accent'}>{executionState.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={runWorkflow}>Run</Button>
                <Button variant="secondary" onClick={() => updateRunState('pause')}>Pause</Button>
                <Button variant="secondary" onClick={() => updateRunState('resume')}>Resume</Button>
                <Button variant="danger" onClick={() => updateRunState('stop')}>Stop</Button>
              </div>
              <div className="max-h-44 overflow-auto rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 text-xs">
                {executionState.logs.length ? executionState.logs.map((log) => (
                  <div key={log.id || `${log.step_index}-${log.created_at}`} className="mb-2">
                    <p className="font-medium">{log.agent} · {log.action}</p>
                    <p className="text-[var(--ui-text-muted)]">{log.message}</p>
                  </div>
                )) : <p className="text-[var(--ui-text-muted)]">No execution logs yet.</p>}
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Mini map</h3>
                <Badge tone="neutral">{state.nodes.length} nodes</Badge>
              </div>
              <div className="relative h-32 overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.18)_1px,transparent_0)] [background-size:12px_12px]" />
                {state.edges.map((edge) => {
                  const from = state.nodes.find((node) => node.id === edge.from);
                  const to = state.nodes.find((node) => node.id === edge.to);
                  if (!from || !to) return null;
                  return (
                    <svg key={edge.id} className="absolute inset-0 h-full w-full">
                      <line x1={from.position.x / 6} y1={from.position.y / 6} x2={to.position.x / 6} y2={to.position.y / 6} stroke="rgba(37,99,235,0.45)" strokeWidth="2" />
                    </svg>
                  );
                })}
                {state.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="absolute h-3 w-3 rounded-full border border-white"
                    style={{ left: `${Math.max(4, node.position.x / 6)}px`, top: `${Math.max(4, node.position.y / 6)}px`, background: node.id === selectedId ? 'var(--ui-accent)' : '#94a3b8' }}
                  />
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <h2 className="font-semibold">Properties Panel</h2>
              {selectedNode ? (
                <div className="space-y-3">
                  <Input value={selectedNode.config.label || ''} onChange={(e) => setState((current) => ({ ...current, nodes: renameNode(current.nodes, selectedNode.id, e.target.value) }))} placeholder="Node name" />
                  <Input value={selectedNode.config.kind || ''} onChange={(e) => updateSelected({ kind: e.target.value })} placeholder="Kind" />
                  <Input value={selectedNode.config.target || ''} onChange={(e) => updateSelected({ target: e.target.value })} placeholder="Target" />
                  <Input value={selectedNode.config.delay || ''} onChange={(e) => updateSelected({ delay: e.target.value })} placeholder="Delay" />
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={duplicateSelected}><Copy size={16} /> Duplicate</Button>
                    <Button variant="danger" onClick={removeSelected}><Trash2 size={16} /> Delete</Button>
                  </div>
                </div>
              ) : (
                <EmptyState title="No node selected" description="Select a node to edit it here." />
              )}
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Workflow Preview</h2>
                <Badge tone={flowValid ? 'success' : 'warning'}>{flowValid ? 'valid' : 'needs review'}</Badge>
              </div>
              {buildPreview.length ? (
                <div className="space-y-2">
                  {buildPreview.map((node) => (
                    <div key={node.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
                      <p className="font-medium">{node.config.label || node.type}</p>
                      <p className="text-xs text-[var(--ui-text-muted)]">{node.type} · {node.position.x}, {node.position.y}</p>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="No nodes yet" description="Add your first node from the library." />}
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setPreviewOpen(true)}><Check size={16} /> View JSON</Button>
                <Button variant="secondary" onClick={() => setState(initialState)}><RotateCcw size={16} /> Reset</Button>
              </div>
            </Card>
          </div>
        </section>

        <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Workflow JSON">
          <pre className="max-h-[65vh] overflow-auto rounded-2xl bg-[var(--ui-surface-muted)] p-4 text-xs">{JSON.stringify(state, null, 2)}</pre>
        </Modal>
      </div>
    </AppShell>
  );
};

export default WorkflowBuilderNoCode;
