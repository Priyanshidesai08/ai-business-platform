import { ApiError } from '../../utils/apiError.js';
import {
  createWorkflowLog,
  createWorkflowRun,
  createWorkflowDefinition,
  createWorkflow,
  deleteWorkflowDefinitionById,
  deleteWorkflowById,
  getLatestWorkflowRun,
  getWorkflowDefinitionById,
  getWorkflowById,
  getWorkflowRunById,
  listWorkflows,
  listWorkflowDefinitions,
  listWorkflowLogs,
  listWorkflowRuns,
  updateWorkflowDefinitionById,
  updateWorkflowById,
  updateWorkflowRunById
} from './workflow.repository.js';

const normalizeSteps = (steps) =>
  Array.isArray(steps)
    ? steps.map((step) => ({
        agent: step.agent || 'sales',
        action: step.action || 'execute',
        input: step.input || {},
        output: step.output || {},
        retry: Number(step.retry || 0),
        timeout: Number(step.timeout || 0),
        condition: step.condition || ''
      }))
    : [];

export const createWorkflowService = ({
  createWorkflowFn = createWorkflow,
  listWorkflowsFn = listWorkflows,
  getWorkflowByIdFn = getWorkflowById,
  updateWorkflowByIdFn = updateWorkflowById,
  deleteWorkflowByIdFn = deleteWorkflowById,
  createWorkflowRunFn = createWorkflowRun,
  updateWorkflowRunByIdFn = updateWorkflowRunById,
  getWorkflowRunByIdFn = getWorkflowRunById,
  createWorkflowLogFn = createWorkflowLog,
  listWorkflowLogsFn = listWorkflowLogs,
  getLatestWorkflowRunFn = getLatestWorkflowRun,
  listWorkflowRunsFn = listWorkflowRuns,
  createWorkflowDefinitionFn = createWorkflowDefinition,
  listWorkflowDefinitionsFn = listWorkflowDefinitions,
  getWorkflowDefinitionByIdFn = getWorkflowDefinitionById,
  updateWorkflowDefinitionByIdFn = updateWorkflowDefinitionById,
  deleteWorkflowDefinitionByIdFn = deleteWorkflowDefinitionById
} = {}) => ({
  createWorkflow: async (userId, payload) => {
    if (!payload?.name?.trim()) throw new ApiError(400, 'Workflow name is required');
    const steps = normalizeSteps(payload.steps);
    return createWorkflowFn({
      userId,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      triggerType: payload.triggerType?.trim() || 'manual',
      steps,
      status: payload.status?.trim() || 'draft'
    });
  },
  listWorkflows: async (userId) => listWorkflowsFn({ userId }),
  getWorkflow: async (userId, workflowId) => {
    const workflow = await getWorkflowByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow not found');
    return workflow;
  },
  updateWorkflow: async (userId, workflowId, payload) => {
    const current = await getWorkflowByIdFn({ userId, workflowId });
    if (!current) throw new ApiError(404, 'Workflow not found');
    return updateWorkflowByIdFn({
      userId,
      workflowId,
      patch: {
        name: payload.name?.trim() || null,
        description: payload.description?.trim() || null,
        triggerType: payload.triggerType?.trim() || null,
        steps: payload.steps ? normalizeSteps(payload.steps) : null,
        status: payload.status?.trim() || null
      }
    });
  },
  deleteWorkflow: async (userId, workflowId) => {
    const current = await getWorkflowByIdFn({ userId, workflowId });
    if (!current) throw new ApiError(404, 'Workflow not found');
    await deleteWorkflowByIdFn({ userId, workflowId });
  },
  runWorkflow: async (userId, workflowId, payload = {}) => {
    const workflow = await getWorkflowByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow not found');

    let steps = [];
    try {
      steps = Array.isArray(workflow.steps) ? workflow.steps : JSON.parse(workflow.steps || '[]');
    } catch {
      steps = [];
    }
    const run = await createWorkflowRunFn({
      workflowId,
      userId,
      triggerType: payload.triggerType || 'manual',
      status: 'running',
      input: payload.input || {},
      output: {},
      currentStep: 0
    });

    await createWorkflowLogFn({
      runId: run.id,
      stepIndex: -1,
      agent: 'workflow',
      action: 'trigger',
      status: 'running',
      message: `Workflow triggered via ${payload.triggerType || 'manual'}`
    });

    const outputs = [];
    let finalStatus = 'success';
    let currentStep = 0;

    for (const step of steps) {
      currentStep += 1;
      const stepOutput = {
        agent: step.agent,
        action: step.action,
        input: step.input,
        condition: step.condition,
        note: `Executed ${step.agent}.${step.action}`
      };

      await createWorkflowLogFn({
        runId: run.id,
        stepIndex: currentStep,
        agent: step.agent,
        action: step.action,
        status: 'running',
        message: `Running step ${currentStep}`,
        input: step.input,
        output: stepOutput
      });

      outputs.push(stepOutput);
      await updateWorkflowRunByIdFn({
        runId: run.id,
        patch: {
          currentStep,
          output: { steps: outputs },
          status: 'running'
        }
      });
    }

    const completedAt = new Date().toISOString();
    const completed = await updateWorkflowRunByIdFn({
      runId: run.id,
      patch: {
        status: finalStatus,
        output: { steps: outputs },
        currentStep,
        startedAt: run.started_at || new Date().toISOString(),
        completedAt
      }
    });

    await createWorkflowLogFn({
      runId: run.id,
      stepIndex: currentStep + 1,
      agent: 'workflow',
      action: 'complete',
      status: finalStatus,
      message: `Workflow completed with status ${finalStatus}`,
      output: { runId: run.id }
    });

    return { run: completed, logs: outputs, status: finalStatus };
  },
  triggerWorkflow: async (userId, workflowId, payload = {}) => {
    const workflow = await getWorkflowByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow not found');
    const run = await createWorkflowRunFn({
      workflowId,
      userId,
      triggerType: payload.triggerType || 'event',
      status: 'pending',
      input: payload.input || {},
      output: {},
      currentStep: 0
    });
    return run;
  },
  getWorkflowStatus: async (userId, workflowId) => {
    const workflow = await getWorkflowByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow not found');
    const latest = await getLatestWorkflowRunFn({ userId, workflowId });
    return latest || { workflow_id: workflowId, status: 'pending' };
  },
  getWorkflowLogs: async (userId, workflowId, runId) => {
    const workflow = await getWorkflowByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow not found');
    const effectiveRunId = runId || (await getLatestWorkflowRunFn({ userId, workflowId }))?.id;
    if (!effectiveRunId) throw new ApiError(404, 'Run not found');
    const run = await getWorkflowRunByIdFn({ userId, runId: effectiveRunId });
    if (!run) throw new ApiError(404, 'Run not found');
    return listWorkflowLogsFn({ runId: effectiveRunId });
  },
  getWorkflowRuns: async (userId, workflowId) => {
    const workflow = await getWorkflowByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow not found');
    return listWorkflowRunsFn({ userId, workflowId });
  },
  updateWorkflowRunStatus: async (userId, workflowId, status) => {
    const workflow = await getWorkflowByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow not found');
    const latest = await getLatestWorkflowRunFn({ userId, workflowId });
    if (!latest) throw new ApiError(404, 'No workflow run found');
    return updateWorkflowRunByIdFn({
      runId: latest.id,
      patch: {
        status,
        completedAt: status === 'running' ? null : new Date().toISOString()
      }
    });
  },
  retryWorkflow: async (userId, workflowId) => {
    const latest = await getLatestWorkflowRunFn({ userId, workflowId });
    if (!latest) throw new ApiError(404, 'No workflow run found');
    const input = latest.input || {};
    return createWorkflowService({
      createWorkflowFn,
      listWorkflowsFn,
      getWorkflowByIdFn,
      updateWorkflowByIdFn,
      deleteWorkflowByIdFn,
      createWorkflowRunFn,
      updateWorkflowRunByIdFn,
      getWorkflowRunByIdFn,
      createWorkflowLogFn,
      listWorkflowLogsFn,
      getLatestWorkflowRunFn,
      listWorkflowRunsFn
    }).runWorkflow(userId, workflowId, { input, triggerType: 'retry' });
  },
  listBuilderWorkflows: async (userId) => listWorkflowDefinitionsFn({ userId }),
  getBuilderWorkflow: async (userId, workflowId) => {
    const workflow = await getWorkflowDefinitionByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow definition not found');
    return workflow;
  },
  createBuilderWorkflow: async (userId, payload = {}) => {
    if (!payload?.name?.trim()) throw new ApiError(400, 'Workflow name is required');
    const workflow = await createWorkflowFn({
      userId,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      triggerType: 'manual',
      steps: [],
      status: 'draft'
    });
    return createWorkflowDefinitionFn({
      id: workflow.id,
      userId,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      nodes: Array.isArray(payload.nodes) ? payload.nodes : [],
      edges: Array.isArray(payload.edges) ? payload.edges : []
    });
  },
  updateBuilderWorkflow: async (userId, workflowId, payload = {}) => {
    const current = await getWorkflowDefinitionByIdFn({ userId, workflowId });
    if (!current) throw new ApiError(404, 'Workflow definition not found');
    await updateWorkflowByIdFn({
      userId,
      workflowId,
      patch: {
        name: payload.name?.trim() || null,
        description: payload.description?.trim() || null,
        triggerType: 'manual',
        steps: [],
        status: 'draft'
      }
    });
    return updateWorkflowDefinitionByIdFn({
      userId,
      workflowId,
      patch: {
        name: payload.name?.trim() || null,
        description: payload.description?.trim() || null,
        nodes: Array.isArray(payload.nodes) ? payload.nodes : null,
        edges: Array.isArray(payload.edges) ? payload.edges : null
      }
    });
  },
  deleteBuilderWorkflow: async (userId, workflowId) => {
    const current = await getWorkflowDefinitionByIdFn({ userId, workflowId });
    if (!current) throw new ApiError(404, 'Workflow definition not found');
    await deleteWorkflowDefinitionByIdFn({ userId, workflowId });
  },
  getBuilderWorkflowStatus: async (userId, workflowId) => {
    const workflow = await getWorkflowDefinitionByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow definition not found');
    const latest = await getLatestWorkflowRunFn({ userId, workflowId });
    return latest || { workflow_id: workflowId, status: 'pending' };
  },
  getBuilderWorkflowLogs: async (userId, workflowId, runId) => {
    const workflow = await getWorkflowDefinitionByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow definition not found');
    const effectiveRunId = runId || (await getLatestWorkflowRunFn({ userId, workflowId }))?.id;
    if (!effectiveRunId) throw new ApiError(404, 'Run not found');
    const run = await getWorkflowRunByIdFn({ userId, runId: effectiveRunId });
    if (!run) throw new ApiError(404, 'Run not found');
    return listWorkflowLogsFn({ runId: effectiveRunId });
  },
  getBuilderWorkflowRuns: async (userId, workflowId) => {
    const workflow = await getWorkflowDefinitionByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow definition not found');
    return listWorkflowRunsFn({ userId, workflowId });
  },
  runBuilderWorkflow: async (userId, workflowId, payload = {}) => {
    const workflow = await getWorkflowDefinitionByIdFn({ userId, workflowId });
    if (!workflow) throw new ApiError(404, 'Workflow definition not found');
    let nodes = [];
    let edges = [];
    try {
      nodes = Array.isArray(workflow.nodes) ? workflow.nodes : JSON.parse(workflow.nodes || '[]');
      edges = Array.isArray(workflow.edges) ? workflow.edges : JSON.parse(workflow.edges || '[]');
    } catch {
      nodes = [];
      edges = [];
    }

    const orderedNodes = nodes.filter((node) => ['trigger', 'start', 'agent', 'decision', 'action', 'delay', 'end'].includes(node.type || node.nodeType || ''));
    const run = await createWorkflowRunFn({
      workflowId,
      userId,
      triggerType: payload.triggerType || 'manual',
      status: 'running',
      input: payload.input || {},
      output: { nodes, edges },
      currentStep: 0
    });

    await createWorkflowLogFn({
      runId: run.id,
      stepIndex: -1,
      agent: 'builder',
      action: 'run',
      status: 'running',
      message: `Builder workflow started via ${payload.triggerType || 'manual'}`
    });

    const stepOutputs = [];
    let stepIndex = 0;
    for (const node of orderedNodes) {
      stepIndex += 1;
      const stepOutput = {
        nodeId: node.id,
        type: node.type,
        label: node.label || node.config?.label || node.type,
        config: node.config || {}
      };

      await createWorkflowLogFn({
        runId: run.id,
        stepIndex,
        agent: node.type || 'agent',
        action: node.config?.action || node.type || 'execute',
        status: 'running',
        message: `Executed ${stepOutput.label}`,
        input: node.config || {},
        output: stepOutput
      });
      stepOutputs.push(stepOutput);

      await updateWorkflowRunByIdFn({
        runId: run.id,
        patch: {
          currentStep: stepIndex,
          output: { nodes: stepOutputs, edges },
          status: 'running'
        }
      });
    }

    const completedAt = new Date().toISOString();
    const completed = await updateWorkflowRunByIdFn({
      runId: run.id,
      patch: {
        status: 'completed',
        output: { nodes: stepOutputs, edges },
        currentStep: stepIndex,
        startedAt: run.started_at || new Date().toISOString(),
        completedAt
      }
    });

    await createWorkflowLogFn({
      runId: run.id,
      stepIndex: stepIndex + 1,
      agent: 'builder',
      action: 'complete',
      status: 'completed',
      message: 'Builder workflow completed',
      output: { runId: run.id }
    });

    return { run: completed, logs: stepOutputs, status: 'completed' };
  }
});

const workflowService = createWorkflowService();

export const createWorkflowRecord = workflowService.createWorkflow;
export const listWorkflowRecords = workflowService.listWorkflows;
export const getWorkflowRecord = workflowService.getWorkflow;
export const updateWorkflowRecord = workflowService.updateWorkflow;
export const deleteWorkflowRecord = workflowService.deleteWorkflow;
export const runWorkflowRecord = workflowService.runWorkflow;
export const triggerWorkflowRecord = workflowService.triggerWorkflow;
export const getWorkflowStatusRecord = workflowService.getWorkflowStatus;
export const getWorkflowLogsRecord = workflowService.getWorkflowLogs;
export const getWorkflowRunsRecord = workflowService.getWorkflowRuns;
export const updateWorkflowRunStatusRecord = workflowService.updateWorkflowRunStatus;
export const retryWorkflowRecord = workflowService.retryWorkflow;
export const listBuilderWorkflowRecords = workflowService.listBuilderWorkflows;
export const getBuilderWorkflowRecord = workflowService.getBuilderWorkflow;
export const createBuilderWorkflowRecord = workflowService.createBuilderWorkflow;
export const updateBuilderWorkflowRecord = workflowService.updateBuilderWorkflow;
export const deleteBuilderWorkflowRecord = workflowService.deleteBuilderWorkflow;
export const runBuilderWorkflowRecord = workflowService.runBuilderWorkflow;
export const getBuilderWorkflowStatusRecord = workflowService.getBuilderWorkflowStatus;
export const getBuilderWorkflowLogsRecord = workflowService.getBuilderWorkflowLogs;
export const getBuilderWorkflowRunsRecord = workflowService.getBuilderWorkflowRuns;
