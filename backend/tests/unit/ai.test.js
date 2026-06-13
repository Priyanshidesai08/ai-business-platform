import test from 'node:test';
import assert from 'node:assert/strict';
import { templateNames, templates } from '../../src/modules/ai/prompt-templates.js';

test('lead score template includes lead data', () => {
  const prompt = templates.leadScore({
    lead: {
      name: 'Acme',
      budget: '10000',
      urgency: 'high',
      companySize: '50',
      interest: 'automation'
    }
  });

  assert.match(prompt, /Evaluate this lead/);
  assert.match(prompt, /Acme/);
  assert.match(prompt, /Return JSON/);
});

test('marketing email template requests subject and body', () => {
  const prompt = templates.marketingEmail({
    input: { audience: 'SMBs', objective: 'lead gen', tone: 'professional', platform: 'email' }
  });

  assert.match(prompt, /marketing email/);
  assert.match(prompt, /subject and body/);
});

test('template registry exposes expected templates', () => {
  assert.ok(templateNames.includes('leadScore'));
  assert.ok(templateNames.includes('supportChat'));
  assert.ok(templateNames.includes('analyticsSummary'));
});
