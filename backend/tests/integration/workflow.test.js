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

test('workflow APIs create, update, view, and delete workflows', async () => {
  const email = `workflow_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Workflow User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  const headers = { Authorization: `Bearer ${login.body.token}` };

  const created = await request('/workflow', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'New customer flow',
      description: 'Sales to marketing',
      triggerType: 'manual',
      status: 'draft',
      steps: [{ agent: 'sales', action: 'qualify', input: { leadId: 'lead-1' }, output: {}, retry: 1, timeout: 30000, condition: 'always' }]
    })
  });
  assert.equal(created.response.status, 201);

  const listed = await request('/workflow', { headers });
  assert.equal(listed.response.status, 200);
  assert.ok(Array.isArray(listed.body.workflows));

  const detail = await request(`/workflow/${created.body.workflow.id}`, { headers });
  assert.equal(detail.response.status, 200);

  const updated = await request(`/workflow/${created.body.workflow.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'active', name: 'Updated flow' })
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.workflow.status, 'active');

  const removed = await request(`/workflow/${created.body.workflow.id}`, {
    method: 'DELETE',
    headers
  });
  assert.equal(removed.response.status, 200);
});

test('workflow execution APIs run and expose logs', async () => {
  const email = `workflow_exec_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Workflow Exec User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  const headers = { Authorization: `Bearer ${login.body.token}` };

  const created = await request('/workflow', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Execution flow',
      description: 'Run sales then marketing',
      triggerType: 'manual',
      status: 'active',
      steps: [
        { agent: 'sales', action: 'qualify', input: { leadId: 'lead-1' }, output: {}, retry: 0, timeout: 0, condition: '' },
        { agent: 'marketing', action: 'campaign', input: { audience: 'SMBs' }, output: {}, retry: 0, timeout: 0, condition: '' }
      ]
    })
  });
  assert.equal(created.response.status, 201);
  const workflowId = created.body.workflow.id || created.body.workflow.workflow_id;
  assert.ok(workflowId);

  const run = await request('/workflow/run', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workflowId, triggerType: 'manual', input: { leadId: 'lead-1' } })
  });
  assert.equal(run.response.status, 200);
  assert.equal(run.body.status, 'success');

  const status = await request(`/workflow/status?workflowId=${workflowId}`, { headers });
  assert.equal(status.response.status, 200);
  assert.ok(status.body.workflowStatus);

  const logs = await request(`/workflow/logs?workflowId=${workflowId}&runId=${run.body.run.id}`, {
    headers
  });
  assert.equal(logs.response.status, 200);
  assert.ok(Array.isArray(logs.body.logs));
  assert.ok(logs.body.logs.length >= 2);

  const runs = await request(`/workflow/runs?workflowId=${workflowId}`, { headers });
  assert.equal(runs.response.status, 200);
  assert.ok(Array.isArray(runs.body.runs));
});
