const STORAGE_KEY = 'nocode-workflow-builder-v1';

export const nodeTypes = [
  { type: 'trigger', label: 'Trigger Node' },
  { type: 'agent', label: 'Agent Node' },
  { type: 'decision', label: 'Decision Node' },
  { type: 'action', label: 'Action Node' },
  { type: 'end', label: 'End Node' }
];

export const createNode = (type, position = { x: 80, y: 80 }, config = {}) => ({
  id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  type,
  position: {
    x: Math.round(position.x / 20) * 20,
    y: Math.round(position.y / 20) * 20
  },
  config: {
    label: config.label || nodeTypes.find((nodeType) => nodeType.type === type)?.label || type,
    ...config
  }
});

export const moveNode = (nodes, nodeId, position) =>
  nodes.map((node) => (node.id === nodeId ? { ...node, position: { x: Math.round(position.x / 20) * 20, y: Math.round(position.y / 20) * 20 } } : node));

export const deleteNode = (nodes, edges, nodeId) => ({
  nodes: nodes.filter((node) => node.id !== nodeId),
  edges: edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId)
});

export const duplicateNode = (nodes, nodeId) => {
  const source = nodes.find((node) => node.id === nodeId);
  if (!source) return nodes;
  const copy = {
    ...source,
    id: `${source.type}-${Date.now()}-copy`,
    position: { x: source.position.x + 40, y: source.position.y + 40 },
    config: { ...source.config, label: `${source.config.label || source.type} copy` }
  };
  return [...nodes, copy];
};

export const renameNode = (nodes, nodeId, label) =>
  nodes.map((node) => (node.id === nodeId ? { ...node, config: { ...node.config, label } } : node));

export const connectNodes = (edges, from, to) => {
  if (!from || !to || from === to) return edges;
  const filtered = edges.filter((edge) => !(edge.from === from && edge.to === to));
  return [...filtered, { id: `edge-${Date.now()}`, from, to }];
};

export const canConnectNodes = (nodes, fromId, toId) => {
  if (!fromId || !toId || fromId === toId) return false;
  const from = nodes.find((node) => node.id === fromId);
  const to = nodes.find((node) => node.id === toId);
  if (!from || !to) return false;
  if (from.type === 'end') return false;
  if (to.type === 'trigger' || to.type === 'start') return false;
  return true;
};

export const validateFlow = (nodes, edges) => {
  const hasTrigger = nodes.some((node) => node.type === 'trigger');
  const hasEnd = nodes.some((node) => node.type === 'end');
  return hasTrigger && hasEnd && edges.length > 0;
};

export const validateConnections = (nodes, edges) => {
  const issues = [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const startNodes = nodes.filter((node) => node.type === 'trigger' || node.type === 'start');
  const endNodes = nodes.filter((node) => node.type === 'end');

  if (startNodes.length !== 1) {
    issues.push('exactly one start node is required');
  }

  for (const edge of edges) {
    if (edge.from === edge.to) {
      issues.push(`self loop detected on ${edge.from}`);
    }
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      issues.push(`edge ${edge.id} points to a missing node`);
    }
  }

  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1);
    outgoing.set(edge.from, (outgoing.get(edge.from) || 0) + 1);
  }

  for (const node of nodes) {
    if ((node.type === 'trigger' || node.type === 'start') && incoming.get(node.id) > 0) {
      issues.push(`start node ${node.id} cannot have incoming links`);
    }
    if (node.type === 'end' && outgoing.get(node.id) > 0) {
      issues.push(`end node ${node.id} cannot have outgoing links`);
    }
  }

  const isolated = nodes.filter((node) => incoming.get(node.id) === 0 && outgoing.get(node.id) === 0);
  if (isolated.length) {
    issues.push(`orphan nodes detected: ${isolated.map((node) => node.id).join(', ')}`);
  }

  if (!endNodes.length) {
    issues.push('at least one end node is required');
  }

  return {
    valid: issues.length === 0 && validateFlow(nodes, edges),
    issues
  };
};

export const saveBuilderState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const restoreBuilderState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const exportBuilderState = (state) => JSON.stringify(state, null, 2);

export const importBuilderState = (json) => JSON.parse(json);
