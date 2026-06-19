import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { query } from '../../src/config/db.js';

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

const makeUser = async () => {
  const email = `recovery_${Date.now()}@example.com`;
  const password = 'SecurePass123';
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Recovery User', email, password })
  });
  return { email, password };
};

test('auth recovery flow sends link and resets password', async () => {
  const { email, password } = await makeUser();

  const forgot = await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  assert.equal(forgot.response.status, 200);
  assert.equal(forgot.body.success, true);
  assert.match(forgot.body.resetLink, /\/reset-password\//);

  const token = forgot.body.resetLink.split('/reset-password/').pop();
  assert.ok(token);

  const invalidEmail = await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'not-an-email' })
  });
  assert.equal(invalidEmail.response.status, 400);

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  await query(
    `UPDATE users
     SET reset_token_expiry = NOW() - INTERVAL '1 minute'
     WHERE email = $1 OR reset_token = $2`,
    [email, hashedToken]
  );

  const expired = await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password: 'NewPass123' })
  });
  assert.equal(expired.response.status, 400);

  const fresh = await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  assert.equal(fresh.response.status, 200);
  const freshToken = fresh.body.resetLink.split('/reset-password/').pop();

  const reset = await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: freshToken, password: 'NewPass123' })
  });
  assert.equal(reset.response.status, 200);
  assert.equal(reset.body.success, true);

  const oldLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  assert.equal(oldLogin.response.status, 401);

  const newLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'NewPass123' })
  });
  assert.equal(newLogin.response.status, 200);
  assert.ok(newLogin.body.token);
});
