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

test('health and swagger respond', async () => {
  const health = await request('/health');
  assert.equal(health.response.status, 200);

  const docs = await request('/api-docs.json');
  assert.equal(docs.response.status, 200);
  assert.equal(docs.body.openapi, '3.0.0');
});

test('sales, marketing, support, and analytics endpoints work together', async () => {
  const email = `integration_${Date.now()}@example.com`;
  const register = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Integration User', email, password: 'SecurePass123' })
  });
  assert.equal(register.response.status, 201);

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  assert.equal(login.response.status, 200);
  const token = login.body.token;

  const authed = (path, options = {}) =>
    request(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

  const lead = await authed('/sales/leads', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Integration Lead',
      email: `lead_${Date.now()}@example.com`,
      company: 'Integration Co',
      budget: '25000',
      urgency: 'high',
      companySize: '100',
      interest: 'automation',
      notes: 'Generated in integration test'
    })
  });
  assert.equal(lead.response.status, 201);

  const score = await authed('/sales/score', {
    method: 'POST',
    body: JSON.stringify({ leadId: lead.body.lead.id })
  });
  assert.equal(score.response.status, 200);

  const marketing = await authed('/marketing/campaign', {
    method: 'POST',
    body: JSON.stringify({
      audience: 'SMBs',
      objective: 'Lead gen',
      tone: 'professional',
      platform: 'linkedin'
    })
  });
  assert.equal(marketing.response.status, 200);

  const ticket = await authed('/support/tickets', {
    method: 'POST',
    body: JSON.stringify({
      customerName: 'Integration Customer',
      subject: 'Need help with rollout',
      status: 'open',
      priority: 'normal',
      history: []
    })
  });
  assert.equal(ticket.response.status, 201);

  const report = await authed('/analytics/report');
  assert.equal(report.response.status, 200);
  assert.equal(typeof report.body.report.leads, 'number');
});

test('orchestrator runs a multi-agent request', async () => {
  const email = `orchestrator_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Orchestrator User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  const token = login.body.token;
  const response = await request('/orchestrator/run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      request: 'Generate campaign for new customer',
      context: {
        customer: { name: 'Acme', email: 'buyer@example.com', company: 'Acme Ltd' },
        budget: '10000',
        urgency: 'high',
        companySize: '200',
        audience: 'B2B teams',
        tone: 'confident',
        platform: 'linkedin'
      }
    })
  });

  assert.equal(response.response.status, 200);
  assert.ok(Array.isArray(response.body.selectedAgents));
  assert.ok(response.body.outputs.sales);
  assert.ok(response.body.outputs.marketing);
  assert.ok(response.body.outputs.analytics);
});

test('unauthorized requests are rejected', async () => {
  const response = await request('/sales/leads');
  assert.equal(response.response.status, 401);
});

test('validation errors surface clearly', async () => {
  const email = `validation_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Validation User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  const token = login.body.token;
  const response = await request('/sales/leads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: '' })
  });

  assert.equal(response.response.status, 400);
  assert.equal(response.body.message, 'Validation failed');
});

test('missing resources return not found', async () => {
  const email = `notfound_${Date.now()}@example.com`;
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Not Found User', email, password: 'SecurePass123' })
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'SecurePass123' })
  });
  const token = login.body.token;
  const response = await request('/sales/leads/00000000-0000-0000-0000-000000000000', {
    headers: { Authorization: `Bearer ${token}` }
  });

  assert.equal(response.response.status, 404);
});
