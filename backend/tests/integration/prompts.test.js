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

test('prompt endpoints support create, version, and restore', async () => {
  const email = `prompt_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Prompt User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  const headers = { Authorization: `Bearer ${login.body.token}` };

  const created = await request('/prompts', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Lead score prompt', module: 'sales', content: 'Evaluate lead.', metadata: { tag: 'sales' } })
  });
  assert.equal(created.response.status, 201);

  const listed = await request('/prompts', { headers });
  assert.equal(listed.response.status, 200);
  assert.ok(Array.isArray(listed.body.prompts));

  const updated = await request(`/prompts/${created.body.prompt.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ content: 'Updated evaluate lead prompt.' })
  });
  assert.equal(updated.response.status, 200);

  const versioned = await request('/prompts/version', {
    method: 'POST',
    headers,
    body: JSON.stringify({ promptId: created.body.prompt.id, content: 'Version 2 content' })
  });
  assert.equal(versioned.response.status, 201);

  const versions = await request(`/prompts/${created.body.prompt.id}/versions`, { headers });
  assert.equal(versions.response.status, 200);
  assert.ok(versions.body.versions.length >= 1);

  const restore = await request('/prompts/restore', {
    method: 'POST',
    headers,
    body: JSON.stringify({ versionId: versioned.body.promptVersion.id })
  });
  assert.equal(restore.response.status, 200);
  assert.equal(restore.body.prompt.content, 'Version 2 content');
});
