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

test('context AI endpoint combines memory, knowledge, and prompt sources', async () => {
  const email = `context_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Context User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  const headers = { Authorization: `Bearer ${login.body.token}` };

  const prompt = await request('/prompts', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Sales prompt', module: 'sales', content: 'Use context to respond with JSON.' })
  });
  const sessionId = `session-${Date.now()}`;
  await request('/memory/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId, role: 'user', message: 'remember my context', metadata: { source: 'test' } })
  });
  await request('/memory/session', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId, activeWork: 'testing context engine', draft: 'draft' })
  });
  const doc = await request('/knowledge/upload', {
    method: 'POST',
    headers,
    body: JSON.stringify({ filename: 'context.txt', mimeType: 'text/plain', content: 'alpha beta context document', metadata: { source: 'test' } })
  });

  const response = await request('/ai/context-generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      module: 'sales',
      promptId: prompt.body.prompt.id,
      input: { prompt: 'Respond carefully' },
      context: {
        sessionId,
        documentIds: [doc.body.document.id],
        query: 'beta'
      }
    })
  });

  assert.equal(response.response.status, 200);
  assert.match(response.body.context.assembledPrompt, /SESSION MEMORY/);
  assert.match(response.body.context.assembledPrompt, /KNOWLEDGE HITS/);
  assert.match(response.body.context.assembledPrompt, /PROMPT CONTENT/);
  assert.ok(response.body.response);
});
