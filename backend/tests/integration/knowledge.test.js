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

test('knowledge endpoints upload, search, and retrieve docs', async () => {
  const email = `knowledge_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Knowledge User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  assert.equal(login.response.status, 200);
  const token = login.body.token;

  const headers = { Authorization: `Bearer ${token}` };
  const upload = await request('/knowledge/upload', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filename: 'guide.txt',
      mimeType: 'text/plain',
      content: 'Alpha knowledge base guide with beta keyword.',
      metadata: { source: 'integration-test' }
    })
  });

  assert.equal(upload.response.status, 201);
  const documentId = upload.body.document.id;

  const files = await request('/knowledge/files', { headers });
  assert.equal(files.response.status, 200);
  assert.ok(Array.isArray(files.body.documents));

  const search = await request('/knowledge/search?query=beta', { headers });
  assert.equal(search.response.status, 200);
  assert.ok(Array.isArray(search.body.documents));

  const retrieve = await request('/knowledge/retrieve', {
    method: 'POST',
    headers,
    body: JSON.stringify({ documentIds: [documentId], query: 'beta' })
  });

  assert.equal(retrieve.response.status, 200);
  assert.ok(Array.isArray(retrieve.body.chunks));
  assert.match(retrieve.body.context, /beta/);

  const remove = await request('/knowledge/file', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ documentId })
  });
  assert.equal(remove.response.status, 200);
});
