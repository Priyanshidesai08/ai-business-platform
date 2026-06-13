import assert from 'assert/strict';

const baseUrl = process.env.API_URL || 'http://localhost:5000';

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
};

const main = async () => {
  const health = await request('/health');
  assert.equal(health.response.status, 200);
  const docs = await request('/api-docs.json');
  assert.equal(docs.response.status, 200);
  const email = `phase2_${Date.now()}@example.com`;
  const register = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Phase Two User',
      email,
      password: 'SecurePass123'
    })
  });
  assert.equal(register.response.status, 201);
  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: 'SecurePass123'
    })
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
      name: 'Phase Two Lead',
      email: `lead_${Date.now()}@example.com`,
      company: 'Example Co',
      budget: '10000',
      urgency: 'high',
      companySize: '50',
      interest: 'automation',
      notes: 'Interested in Phase 2'
    })
  });
  assert.equal(lead.response.status, 201);
  const score = await authed('/sales/score', {
    method: 'POST',
    body: JSON.stringify({ leadId: lead.body.lead.id })
  });
  assert.equal(score.response.status, 200);
  const marketing = await authed('/marketing/post', {
    method: 'POST',
    body: JSON.stringify({
      audience: 'SMBs',
      objective: 'Lead gen',
      tone: 'professional',
      platform: 'linkedin'
    })
  });
  assert.equal(marketing.response.status, 200);
  const chat = await authed('/support/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'How do I get support?',
      history: []
    })
  });
  assert.equal(chat.response.status, 200);
  const leads = await authed('/sales/leads');
  assert.equal(leads.response.status, 200);
  const report = await authed('/analytics/report');
  assert.equal(report.response.status, 200);
  console.log('Phase 2 smoke test passed');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
