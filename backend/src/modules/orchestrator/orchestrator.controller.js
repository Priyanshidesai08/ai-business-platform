import { buildWorkflowPreview, compareRuns, exportRun, exportTelemetry, getAgentTiming, getNotifications, getRun, getStats, runOrchestration, listRuns, streamOrchestration } from './orchestrator.service.js';

export const run = async (req, res, next) => {
  try {
    const result = await runOrchestration(req.user.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const runs = async (req, res, next) => {
  try {
    res.status(200).json({ runs: await listRuns(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const runDetail = async (req, res, next) => {
  try {
    const run = await getRun(req.user.id, req.params.id);
    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }
    res.status(200).json(run);
  } catch (error) {
    next(error);
  }
};

export const runCompare = async (req, res, next) => {
  try {
    const runIds = String(req.query.ids || '').split(',').filter(Boolean);
    res.status(200).json({ comparisons: await compareRuns(req.user.id, runIds) });
  } catch (error) {
    next(error);
  }
};

export const runExport = async (req, res, next) => {
  try {
    const exported = await exportRun(req.user.id, req.params.id);
    if (!exported) {
      return res.status(404).json({ message: 'Run not found' });
    }
    res.status(200).json(exported);
  } catch (error) {
    next(error);
  }
};

export const runStream = async (req, res, next) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    const send = (payload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const result = await streamOrchestration(req.user.id, req.body, async (event) => {
      send(event);
    });

    send({ type: 'result', result });
    res.end();
  } catch (error) {
    next(error);
  }
};

export const stats = async (req, res, next) => {
  try {
    res.status(200).json({ stats: await getStats(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const notifications = async (req, res, next) => {
  try {
    res.status(200).json({ notifications: await getNotifications(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const workflowPreview = async (req, res, next) => {
  try {
    res.status(200).json(await buildWorkflowPreview(req.body));
  } catch (error) {
    next(error);
  }
};

export const timings = async (req, res, next) => {
  try {
    res.status(200).json({ timings: await getAgentTiming(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const telemetry = async (req, res, next) => {
  try {
    res.status(200).json(await exportTelemetry(req.user.id));
  } catch (error) {
    next(error);
  }
};
