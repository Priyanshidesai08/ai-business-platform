import test from 'node:test';
import assert from 'node:assert/strict';

const baseUrl = process.env.API_URL || 'http://localhost:5001';

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
};

test('builder workflow APIs persist nodes and edges', async () => {
  const email = `builder_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Builder User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  const headers = { Authorization: `Bearer ${login.body.token}` };

  const created = await request('/builder/workflow', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Builder flow',
      description: 'Persist canvas nodes and edges',
      nodes: [
        { id: 'node-1', type: 'start', label: 'Start', position: { x: 80, y: 120 }, config: { agent: 'workflow' } },
        { id: 'node-2', type: 'agent', label: 'Sales', position: { x: 260, y: 120 }, config: { agent: 'sales' } }
      ],
      edges: [{ id: 'edge-1', from: 'node-1', to: 'node-2' }]
    })
  });

  assert.equal(created.response.status, 201);
  assert.equal(created.body.workflow.name, 'Builder flow');

  const listed = await request('/builder/workflow', { headers });
  assert.equal(listed.response.status, 200);
  assert.ok(Array.isArray(listed.body.workflows));

  const detail = await request(`/builder/workflow/${created.body.workflow.id}`, { headers });
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body.workflow.edges.length, 1);

  const updated = await request(`/builder/workflow/${created.body.workflow.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: 'Builder flow updated',
      nodes: [
        { id: 'node-1', type: 'start', label: 'Start', position: { x: 80, y: 120 }, config: { agent: 'workflow' } },
        { id: 'node-2', type: 'agent', label: 'Marketing', position: { x: 300, y: 120 }, config: { agent: 'marketing' } }
      ],
      edges: [{ id: 'edge-1', from: 'node-1', to: 'node-2' }]
    })
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.workflow.name, 'Builder flow updated');

  const run = await request('/builder/run', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workflowId: created.body.workflow.id, triggerType: 'manual', input: { source: 'test' } })
  });
  assert.equal(run.response.status, 200);
  assert.equal(run.body.status, 'completed');

  const status = await request(`/builder/status?workflowId=${created.body.workflow.id}`, { headers });
  assert.equal(status.response.status, 200);

  const logs = await request(`/builder/logs?workflowId=${created.body.workflow.id}&runId=${run.body.run.id}`, { headers });
  assert.equal(logs.response.status, 200);
  assert.ok(Array.isArray(logs.body.logs));

  const removed = await request(`/builder/workflow/${created.body.workflow.id}`, {
    method: 'DELETE',
    headers
  });
  assert.equal(removed.response.status, 200);
});
