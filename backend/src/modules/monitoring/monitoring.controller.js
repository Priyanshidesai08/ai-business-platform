import { addFeedback, buildMonitoringDashboard, listEvents, listFeedback, listMetrics, logMetric, recordMonitoringEvent } from './monitoring.service.js';

export const dashboard = async (req, res, next) => {
  try {
    res.status(200).json({ dashboard: await buildMonitoringDashboard(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const metrics = async (req, res, next) => {
  try {
    res.status(200).json({ metrics: await listMetrics(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const events = async (req, res, next) => {
  try {
    res.status(200).json({ events: await listEvents(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const feedback = async (req, res, next) => {
  try {
    res.status(200).json({ feedback: await listFeedback(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const createMetric = async (req, res, next) => {
  try {
    const metric = await logMetric(req.user.id, req.body);
    res.status(201).json({ metric });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await recordMonitoringEvent(req.user.id, req.body);
    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
};

export const createFeedback = async (req, res, next) => {
  try {
    const item = await addFeedback(req.user.id, req.body);
    res.status(201).json({ feedback: item });
  } catch (error) {
    next(error);
  }
};
