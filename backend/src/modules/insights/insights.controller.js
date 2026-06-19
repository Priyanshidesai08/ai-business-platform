import { buildInsights, getTrends, predictInsights } from './insights.service.js';

export const summary = async (req, res, next) => {
  try {
    res.status(200).json({ insights: await buildInsights(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const predict = async (req, res, next) => {
  try {
    res.status(200).json({ prediction: await predictInsights(req.user.id, req.body) });
  } catch (error) {
    next(error);
  }
};

export const trends = async (req, res, next) => {
  try {
    res.status(200).json({ trends: await getTrends(req.user.id) });
  } catch (error) {
    next(error);
  }
};

