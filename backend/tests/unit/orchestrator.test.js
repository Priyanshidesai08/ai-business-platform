import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrchestratorService, decideAgents } from '../../src/modules/orchestrator/orchestrator.service.js';

test('decideAgents selects a sales-marketing-support-analytics chain for campaign requests', () => {
  const agents = decideAgents({
    request: 'Generate campaign for new customer'
  });

  assert.deepEqual(
    agents.map((agent) => agent.key),
    ['sales', 'marketing', 'support', 'analytics']
  );
});

test('runOrchestration executes selected agents and returns synthesis', async () => {
  const calls = { lead: [], score: [], campaign: [], report: [], ai: [], insert: [] };
  const orchestrator = createOrchestratorService({
    fetchOneFn: async (sql, params) => {
      calls.insert.push({ sql, params });
      if (sql.includes('INSERT INTO orchestration_runs')) {
        return { id: 'run-1', status: 'running' };
      }
      if (sql.includes('INSERT INTO orchestration_steps')) {
        return { id: `step-${calls.insert.length}` };
      }
      if (sql.includes('UPDATE orchestration_runs')) {
        return { id: 'run-1', status: params[1], outcome: params[2] };
      }
      return null;
    },
    executeFn: async () => null,
    createLeadFn: async (_userId, lead) => {
      calls.lead.push(lead);
      return { id: 'lead-1', ...lead };
    },
    scoreLeadFn: async (_userId, leadId) => {
      calls.score.push(leadId);
      return { lead: { id: leadId, score: 88 }, ai: { score: 88, category: 'Hot' } };
    },
    generateCampaignFn: async (_userId, input) => {
      calls.campaign.push(input);
      return { campaign: { id: 'campaign-1', content: 'campaign content' }, ai: { name: 'Launch' } };
    },
    buildReportFn: async () => {
      calls.report.push(true);
      return { leads: 1, campaigns: 1, ticketVolume: 0, engagementRate: '1.00', conversionRate: '100.00' };
    },
    generateAiFn: async () => {
      calls.ai.push(true);
      return { response: { summary: 'Synthesized orchestration' } };
    },
    buildSharedContextFn: async () => ({ leads: [], campaigns: [], tickets: [], analytics: {} }),
    decideAgentsFn: () => ([
      { key: 'sales', name: 'Sales', confidence: 0.91 },
      { key: 'marketing', name: 'Marketing', confidence: 0.82 },
      { key: 'analytics', name: 'Analytics', confidence: 0.42 }
    ])
  });

  const result = await orchestrator.runOrchestration('user-1', {
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
  });

  assert.equal(result.selectedAgents.length, 3);
  assert.ok(result.outputs.sales);
  assert.ok(result.outputs.marketing);
  assert.ok(result.outputs.analytics);
  assert.equal(calls.lead.length, 1);
  assert.equal(calls.score.length, 1);
  assert.equal(calls.campaign.length, 1);
  assert.equal(calls.report.length, 1);
  assert.equal(calls.ai.length, 1);
});
