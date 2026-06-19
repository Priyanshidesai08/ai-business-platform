import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkflowService } from '../../src/modules/workflow/workflow.service.js';
import { ApiError } from '../../src/utils/apiError.js';

test('builder workflow service saves and restores nodes and edges', async () => {
  let created = null;
  const service = createWorkflowService({
    createWorkflowFn: async (input) => ({ id: 'workflow-parent-1', ...input }),
    createWorkflowDefinitionFn: async (input) => {
      created = input;
      return { id: 'builder-1', ...input };
    },
    listWorkflowDefinitionsFn: async () => [{ id: 'builder-1', name: 'Flow', nodes: [], edges: [] }],
    getWorkflowDefinitionByIdFn: async () => ({ id: 'builder-1', name: 'Flow', nodes: [{ id: 'node-1' }], edges: [] }),
    updateWorkflowByIdFn: async (input) => ({ id: input.workflowId, ...input.patch }),
    updateWorkflowDefinitionByIdFn: async ({ workflowId, patch }) => ({ id: workflowId, patch }),
    deleteWorkflowDefinitionByIdFn: async () => true
  });

  const createdWorkflow = await service.createBuilderWorkflow('user-1', {
    name: 'Flow',
    nodes: [{ id: 'node-1', type: 'start' }],
    edges: [{ id: 'edge-1', from: 'node-1', to: 'node-2' }]
  });

  assert.equal(createdWorkflow.id, 'workflow-parent-1');
  assert.equal(created.id, 'workflow-parent-1');
  assert.equal(created.name, 'Flow');
  assert.equal(created.nodes[0].type, 'start');

  const workflows = await service.listBuilderWorkflows('user-1');
  assert.equal(workflows.length, 1);

  const detail = await service.getBuilderWorkflow('user-1', 'builder-1');
  assert.equal(detail.id, 'builder-1');

  const updated = await service.updateBuilderWorkflow('user-1', 'builder-1', {
    name: 'Flow 2',
    nodes: [{ id: 'node-2' }],
    edges: [{ id: 'edge-2' }]
  });
  assert.equal(updated.id, 'builder-1');
  assert.equal(updated.patch.name, 'Flow 2');

  await service.deleteBuilderWorkflow('user-1', 'builder-1');
});

test('builder workflow service rejects missing name', async () => {
  const service = createWorkflowService();

  await assert.rejects(
    service.createBuilderWorkflow('user-1', { nodes: [], edges: [] }),
    (error) => error instanceof ApiError && error.statusCode === 400
  );
});
