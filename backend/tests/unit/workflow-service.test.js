import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkflowService } from '../../src/modules/workflow/workflow.service.js';
import { ApiError } from '../../src/utils/apiError.js';

test('createWorkflow normalizes steps', async () => {
  let created = null;
  const service = createWorkflowService({
    createWorkflowFn: async (input) => {
      created = input;
      return { id: 'workflow-1', ...input };
    }
  });

  const result = await service.createWorkflow('user-1', {
    name: 'Flow',
    steps: [{ agent: 'sales', action: 'qualify' }]
  });

  assert.equal(result.id, 'workflow-1');
  assert.equal(created.steps[0].agent, 'sales');
  assert.equal(created.steps[0].timeout, 0);
});

test('getWorkflow throws when missing', async () => {
  const service = createWorkflowService({
    getWorkflowByIdFn: async () => null
  });

  await assert.rejects(
    service.getWorkflow('user-1', 'missing'),
    (error) => error instanceof ApiError && error.statusCode === 404
  );
});

test('runWorkflow records execution output', async () => {
  const createdRuns = [];
  const createdLogs = [];
  const updatedRuns = [];

  const service = createWorkflowService({
    getWorkflowByIdFn: async () => ({
      id: 'workflow-1',
      steps: [{ agent: 'sales', action: 'qualify', input: { leadId: 'lead-1' }, output: {}, retry: 0, timeout: 0, condition: '' }]
    }),
    createWorkflowRunFn: async (input) => {
      createdRuns.push(input);
      return { id: 'run-1', ...input, started_at: '2026-06-14T00:00:00.000Z' };
    },
    createWorkflowLogFn: async (input) => {
      createdLogs.push(input);
      return { id: `log-${createdLogs.length}`, ...input };
    },
    updateWorkflowRunByIdFn: async (input) => {
      updatedRuns.push(input);
      return { id: 'run-1', status: input.patch.status, current_step: input.patch.currentStep };
    }
  });

  const result = await service.runWorkflow('user-1', 'workflow-1', { input: { leadId: 'lead-1' } });

  assert.equal(result.status, 'success');
  assert.equal(createdRuns[0].status, 'running');
  assert.ok(createdLogs.length >= 2);
  assert.ok(updatedRuns.length >= 1);
});
