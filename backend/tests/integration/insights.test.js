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

test('insights endpoints return summary, prediction, and trends', async () => {
  const email = `insights_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Insights User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  const headers = { Authorization: `Bearer ${login.body.token}` };

  const summary = await request('/insights', { headers });
  assert.equal(summary.response.status, 200);
  assert.ok(summary.body.insights.metrics);

  const prediction = await request('/insights/predict', {
    method: 'POST',
    headers,
    body: JSON.stringify({ horizon: '30d' })
  });
  assert.equal(prediction.response.status, 200);
  assert.ok(prediction.body.prediction.forecast);

  const trends = await request('/insights/trends', { headers });
  assert.equal(trends.response.status, 200);
  assert.ok(Array.isArray(trends.body.trends));
});

