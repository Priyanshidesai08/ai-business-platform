import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../../src/utils/apiError.js';
import { createSalesService, scoreToCategory } from '../../src/modules/sales-agent/sales.service.js';

test('scoreToCategory maps boundary values', () => {
  assert.equal(scoreToCategory(75), 'Hot');
  assert.equal(scoreToCategory(45), 'Warm');
  assert.equal(scoreToCategory(44), 'Cold');
});

test('createLeadService persists customer notes after lead creation', async () => {
  const executeCalls = [];
  const createLeadFn = async () => ({
    id: 'lead-1',
    name: 'Acme Lead',
    email: 'lead@example.com',
    company: 'Acme',
    notes: 'initial notes'
  });

  const { createLeadService } = createSalesService({
    createLeadFn,
    executeFn: async (...args) => executeCalls.push(args)
  });

  const result = await createLeadService('user-1', { name: 'Acme Lead', email: 'lead@example.com' });
  assert.equal(result.id, 'lead-1');
  assert.equal(executeCalls.length, 1);
  assert.match(executeCalls[0][0], /INSERT INTO customers/);
});

test('updateLeadService throws when the lead does not exist', async () => {
  const { updateLeadService } = createSalesService({
    updateLeadFn: async () => null
  });

  await assert.rejects(
    updateLeadService('user-1', 'missing-lead', { notes: 'nope' }),
    (error) => error instanceof ApiError && error.statusCode === 404
  );
});

test('scoreLeadService throws when the lead does not exist', async () => {
  const { scoreLeadService } = createSalesService({
    getLeadFn: async () => null
  });

  await assert.rejects(
    scoreLeadService('user-1', 'missing-lead'),
    (error) => error instanceof ApiError && error.statusCode === 404
  );
});

test('followUpLeadService throws when the lead does not exist', async () => {
  const { followUpLeadService } = createSalesService({
    getLeadFn: async () => null
  });

  await assert.rejects(
    followUpLeadService('user-1', 'missing-lead'),
    (error) => error instanceof ApiError && error.statusCode === 404
  );
});
