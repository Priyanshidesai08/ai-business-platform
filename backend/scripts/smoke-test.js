const baseUrl = process.env.API_URL || 'http://localhost:5000';
const uniqueEmail = `phase1_${Date.now()}@example.com`;
const password = 'SecurePass123';

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
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

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async () => {
  const health = await request('/health');
  assert(health.response.ok, 'Health check failed');

  const docsJson = await request('/api-docs.json');
  assert(docsJson.response.ok, 'Swagger JSON endpoint failed');
  assert(docsJson.body?.openapi === '3.0.0', 'Swagger JSON did not return OpenAPI 3 spec');

  const docsUi = await fetch(`${baseUrl}/api-docs`);
  assert(docsUi.ok, 'Swagger UI endpoint failed');

  const unauthorized = await request('/auth/profile');
  assert(unauthorized.response.status === 401, 'Unauthorized profile request should return 401');

  const register = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Phase One User',
      email: uniqueEmail,
      password
    })
  });
  assert(register.response.status === 201, 'User registration failed');

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: uniqueEmail,
      password
    })
  });
  assert(login.response.status === 200, 'User login failed');
  assert(login.body?.token, 'JWT token missing from login response');

  const token = login.body.token;
  const profile = await request('/auth/profile', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  assert(profile.response.status === 200, 'Authorized profile request failed');
  assert(profile.body?.user?.email === uniqueEmail, 'Profile response did not match logged in user');

  const logout = await request('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  assert(logout.response.status === 200, 'Logout failed');

  const revoked = await request('/auth/profile', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  assert(revoked.response.status === 401, 'Revoked session should not access protected profile');

  console.log('Smoke test passed');
};

run().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
