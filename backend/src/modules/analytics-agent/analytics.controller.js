import { buildReport, getConversions } from './analytics.service.js';

export const report = async (req, res, next) => {
  try {
    res.status(200).json({ report: await buildReport(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const conversions = async (req, res, next) => {
  try {
    res.status(200).json({ conversions: await getConversions(req.user.id) });
  } catch (error) {
    next(error);
  }
};
