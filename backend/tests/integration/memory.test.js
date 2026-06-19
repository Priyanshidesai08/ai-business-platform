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

test('memory endpoints save and restore conversation state', async () => {
  const email = `memory_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Memory User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  assert.equal(login.response.status, 200);
  const token = login.body.token;
  const headers = { Authorization: `Bearer ${token}` };
  const sessionId = `memory-session-${Date.now()}`;

  const message = await request('/memory/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId, role: 'user', message: 'Remember this conversation', metadata: { source: 'test' } })
  });
  assert.equal(message.response.status, 201);

  const session = await request('/memory/session', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId, activeWork: 'Working memory', draft: 'Draft text' })
  });
  assert.equal(session.response.status, 201);

  const history = await request(`/memory/history/${sessionId}`, { headers });
  assert.equal(history.response.status, 200);
  assert.ok(Array.isArray(history.body.messages));
  assert.equal(history.body.messages.length, 1);

  const restored = await request('/memory/session?sessionId=' + encodeURIComponent(sessionId), { headers });
  assert.equal(restored.response.status, 200);
  assert.equal(restored.body.session.session_id, sessionId);

  const agent = await request('/memory/agent', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      agentId: 'sales',
      summary: 'Customer prefers concise follow-up',
      shortTerm: [{ note: 'budget 10k' }],
      longTerm: [{ note: 'enterprise lead' }],
      decisions: [{ decision: 'route to sales' }],
      context: { sessionId }
    })
  });
  assert.equal(agent.response.status, 201);

  const agentMemory = await request('/memory/agent/sales', { headers });
  assert.equal(agentMemory.response.status, 200);
  assert.equal(agentMemory.body.memory.agent_id, 'sales');
});
