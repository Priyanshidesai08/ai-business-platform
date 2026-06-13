import { ApiError } from '../../utils/apiError.js';
import { chatSupport, createTicket, listTickets } from './support.service.js';

export const chat = async (req, res, next) => {
  try {
    const response = await chatSupport(req.user.id, req.body.message, req.body.history || []);
    res.status(200).json({ response });
  } catch (error) {
    next(error);
  }
};

export const tickets = async (req, res, next) => {
  try {
    res.status(200).json({ tickets: await listTickets(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const ticket = await createTicket(req.user.id, req.body);
    res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
};
