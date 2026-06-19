import {
  createBuilderWorkflowRecord,
  createWorkflowRecord,
  deleteBuilderWorkflowRecord,
  deleteWorkflowRecord,
  getBuilderWorkflowLogsRecord,
  getBuilderWorkflowRecord,
  getBuilderWorkflowRunsRecord,
  getBuilderWorkflowStatusRecord,
  getWorkflowRecord,
  getWorkflowLogsRecord,
  getWorkflowStatusRecord,
  getWorkflowRunsRecord,
  listBuilderWorkflowRecords,
  listWorkflowRecords,
  runBuilderWorkflowRecord,
  runWorkflowRecord,
  retryWorkflowRecord,
  updateWorkflowRunStatusRecord,
  triggerWorkflowRecord,
  updateBuilderWorkflowRecord,
  updateWorkflowRecord
} from './workflow.service.js';

export const create = async (req, res, next) => {
  try {
    const workflow = await createWorkflowRecord(req.user.id, req.body);
    res.status(201).json({ message: 'Workflow saved', workflow });
  } catch (error) {
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const workflows = await listWorkflowRecords(req.user.id);
    res.status(200).json({ workflows });
  } catch (error) {
    next(error);
  }
};

export const detail = async (req, res, next) => {
  try {
    const workflow = await getWorkflowRecord(req.user.id, req.params.id);
    res.status(200).json({ workflow });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const workflow = await updateWorkflowRecord(req.user.id, req.params.id, req.body);
    res.status(200).json({ message: 'Workflow updated', workflow });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await deleteWorkflowRecord(req.user.id, req.params.id);
    res.status(200).json({ message: 'Workflow deleted' });
  } catch (error) {
    next(error);
  }
};

export const builderList = async (req, res, next) => {
  try {
    const workflows = await listBuilderWorkflowRecords(req.user.id);
    res.status(200).json({ workflows });
  } catch (error) {
    next(error);
  }
};

export const builderDetail = async (req, res, next) => {
  try {
    const workflow = await getBuilderWorkflowRecord(req.user.id, req.params.id);
    res.status(200).json({ workflow });
  } catch (error) {
    next(error);
  }
};

export const builderCreate = async (req, res, next) => {
  try {
    const workflow = await createBuilderWorkflowRecord(req.user.id, req.body);
    res.status(201).json({ message: 'Workflow saved', workflow });
  } catch (error) {
    next(error);
  }
};

export const builderUpdate = async (req, res, next) => {
  try {
    const workflow = await updateBuilderWorkflowRecord(req.user.id, req.params.id, req.body);
    res.status(200).json({ message: 'Workflow updated', workflow });
  } catch (error) {
    next(error);
  }
};

export const builderRemove = async (req, res, next) => {
  try {
    await deleteBuilderWorkflowRecord(req.user.id, req.params.id);
    res.status(200).json({ message: 'Workflow deleted' });
  } catch (error) {
    next(error);
  }
};

export const run = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.body.id || req.params.id;
    const result = await runWorkflowRecord(req.user.id, workflowId, req.body);
    res.status(200).json({ message: 'Workflow run started', ...result });
  } catch (error) {
    next(error);
  }
};

export const trigger = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.body.id || req.params.id;
    const runRecord = await triggerWorkflowRecord(req.user.id, workflowId, req.body);
    res.status(201).json({ message: 'Workflow triggered', run: runRecord });
  } catch (error) {
    next(error);
  }
};

export const status = async (req, res, next) => {
  try {
    const workflowId = req.query.workflowId || req.params.id;
    const workflowStatus = await getWorkflowStatusRecord(req.user.id, workflowId);
    res.status(200).json({ workflowStatus });
  } catch (error) {
    next(error);
  }
};

export const logs = async (req, res, next) => {
  try {
    const workflowId = req.query.workflowId || req.params.id;
    const runId = req.query.runId;
    const workflowLogs = await getWorkflowLogsRecord(req.user.id, workflowId, runId);
    res.status(200).json({ logs: workflowLogs });
  } catch (error) {
    next(error);
  }
};

export const runs = async (req, res, next) => {
  try {
    const workflowId = req.query.workflowId || req.params.id;
    const workflowRuns = await getWorkflowRunsRecord(req.user.id, workflowId);
    res.status(200).json({ runs: workflowRuns });
  } catch (error) {
    next(error);
  }
};

export const pause = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.params.id;
    const run = await updateWorkflowRunStatusRecord(req.user.id, workflowId, 'paused');
    res.status(200).json({ message: 'Workflow paused', run });
  } catch (error) {
    next(error);
  }
};

export const resume = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.params.id;
    const run = await updateWorkflowRunStatusRecord(req.user.id, workflowId, 'running');
    res.status(200).json({ message: 'Workflow resumed', run });
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.params.id;
    const run = await updateWorkflowRunStatusRecord(req.user.id, workflowId, 'cancelled');
    res.status(200).json({ message: 'Workflow cancelled', run });
  } catch (error) {
    next(error);
  }
};

export const retry = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.params.id;
    const result = await retryWorkflowRecord(req.user.id, workflowId);
    res.status(200).json({ message: 'Workflow retried', ...result });
  } catch (error) {
    next(error);
  }
};

export const builderRun = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.body.id || req.params.id;
    const result = await runBuilderWorkflowRecord(req.user.id, workflowId, req.body);
    res.status(200).json({ message: 'Workflow run started', ...result });
  } catch (error) {
    next(error);
  }
};

export const builderPause = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.body.id || req.params.id;
    const run = await updateWorkflowRunStatusRecord(req.user.id, workflowId, 'paused');
    res.status(200).json({ message: 'Workflow paused', run });
  } catch (error) {
    next(error);
  }
};

export const builderResume = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.body.id || req.params.id;
    const run = await updateWorkflowRunStatusRecord(req.user.id, workflowId, 'running');
    res.status(200).json({ message: 'Workflow resumed', run });
  } catch (error) {
    next(error);
  }
};

export const builderStop = async (req, res, next) => {
  try {
    const workflowId = req.body.workflowId || req.body.workflow_id || req.body.id || req.params.id;
    const run = await updateWorkflowRunStatusRecord(req.user.id, workflowId, 'cancelled');
    res.status(200).json({ message: 'Workflow stopped', run });
  } catch (error) {
    next(error);
  }
};

export const builderStatus = async (req, res, next) => {
  try {
    const workflowId = req.query.workflowId || req.params.id;
    const workflowStatus = await getBuilderWorkflowStatusRecord(req.user.id, workflowId);
    res.status(200).json({ workflowStatus });
  } catch (error) {
    next(error);
  }
};

export const builderLogs = async (req, res, next) => {
  try {
    const workflowId = req.query.workflowId || req.params.id;
    const runId = req.query.runId;
    const workflowLogs = await getBuilderWorkflowLogsRecord(req.user.id, workflowId, runId);
    res.status(200).json({ logs: workflowLogs });
  } catch (error) {
    next(error);
  }
};

export const builderRuns = async (req, res, next) => {
  try {
    const workflowId = req.query.workflowId || req.params.id;
    const workflowRuns = await getBuilderWorkflowRunsRecord(req.user.id, workflowId);
    res.status(200).json({ runs: workflowRuns });
  } catch (error) {
    next(error);
  }
};
