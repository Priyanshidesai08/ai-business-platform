import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, fetchOne } from '../../src/shared/db.js';
import { buildInsights, predictInsights } from '../../src/modules/insights/insights.service.js';

const ensureSchema = async () => {
  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS workflows (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_by UUID NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      trigger_type TEXT NOT NULL DEFAULT 'manual',
      steps JSONB NOT NULL DEFAULT '[]'::jsonb,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Cold',
      status TEXT NOT NULL DEFAULT 'new',
      score INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      audience TEXT,
      objective TEXT,
      tone TEXT,
      platform TEXT,
      content_type TEXT,
      content JSONB,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS tickets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workflow_id UUID NOT NULL,
      user_id UUID NOT NULL,
      trigger_type TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'pending',
      input JSONB NOT NULL DEFAULT '{}'::jsonb,
      output JSONB NOT NULL DEFAULT '{}'::jsonb,
      error TEXT DEFAULT '',
      current_step INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS insights_predictions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      horizon VARCHAR(30) NOT NULL DEFAULT '30d',
      confidence NUMERIC(5, 2) NOT NULL DEFAULT 0,
      forecast JSONB NOT NULL DEFAULT '{}'::jsonb,
      trend_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
      anomaly_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const createTestUser = async () => {
  await ensureSchema();
  const email = `insights_unit_${Date.now()}@example.com`;
  const user = await fetchOne(
    `INSERT INTO users (name, email, password, role)
     VALUES ('Insights Unit User', $1, 'hashed-password', 'user')
     RETURNING id`,
    [email]
  );
  const workflow = await fetchOne(
    `INSERT INTO workflows (created_by, name, description, trigger_type, steps, status)
     VALUES ($1, 'Insight Workflow', 'Test workflow', 'manual', '[]'::jsonb, 'active')
     RETURNING id`,
    [user.id]
  );
  await execute('INSERT INTO leads (user_id, name, email, category, status, score) VALUES ($1, $2, $3, $4, $5, $6)', [user.id, 'Lead A', email, 'Hot', 'new', 90]);
  await execute('INSERT INTO campaigns (user_id, audience, objective, tone, platform, content_type, content, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [user.id, 'SMBs', 'growth', 'professional', 'linkedin', 'campaign', JSON.stringify({ copy: 'Campaign A' }), 'active']);
  await execute('INSERT INTO tickets (user_id, customer_name, subject, status, priority, history, ai_response) VALUES ($1, $2, $3, $4, $5, $6, $7)', [user.id, 'Customer A', 'Ticket A', 'resolved', 'normal', JSON.stringify([]), 'Resolved']);
  await execute('INSERT INTO workflow_runs (workflow_id, user_id, trigger_type, status, input, output, current_step) VALUES ($1, $2, $3, $4, $5, $6, $7)', [workflow.id, user.id, 'manual', 'success', JSON.stringify({}), JSON.stringify({}), 1]);
  return user.id;
};

test('buildInsights derives metrics and recommendations', async () => {
  const userId = await createTestUser();
  const insights = await buildInsights(userId);
  assert.ok(insights.metrics);
  assert.ok(Array.isArray(insights.recommendations));
});

test('predictInsights returns forecast data', async () => {
  const userId = await createTestUser();
  const prediction = await predictInsights(userId, { horizon: '30d' });
  assert.ok(prediction.forecast);
  assert.ok(typeof prediction.confidence === 'number');
});
