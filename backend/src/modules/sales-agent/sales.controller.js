import { ApiError } from '../../utils/apiError.js';
import {
  createLeadService,
  deleteLeadService,
  followUpLeadService,
  getLeadService,
  listLeadsService,
  scoreLeadService,
  updateLeadService
} from './sales.service.js';

export const createLead = async (req, res, next) => {
  try {
    const lead = await createLeadService(req.user.id, req.body);
    res.status(201).json({ lead });
  } catch (error) {
    next(error);
  }
};

export const listLeads = async (req, res, next) => {
  try {
    const leads = await listLeadsService(req.user.id);
    res.status(200).json({ leads });
  } catch (error) {
    next(error);
  }
};

export const getLead = async (req, res, next) => {
  try {
    const lead = await getLeadService(req.user.id, req.params.id);
    if (!lead) throw new ApiError(404, 'Lead not found');
    res.status(200).json({ lead });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const lead = await updateLeadService(req.user.id, req.params.id, req.body);
    res.status(200).json({ lead });
  } catch (error) {
    next(error);
  }
};

export const removeLead = async (req, res, next) => {
  try {
    await deleteLeadService(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const scoreLead = async (req, res, next) => {
  try {
    const result = await scoreLeadService(req.user.id, req.body.leadId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const followUpLead = async (req, res, next) => {
  try {
    const result = await followUpLeadService(req.user.id, req.body.leadId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
