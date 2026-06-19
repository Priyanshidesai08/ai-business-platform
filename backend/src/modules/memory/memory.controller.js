import {
  deleteHistoryBySessionService,
  getAgentMemoryById,
  getHistory,
  getHistoryBySession,
  getSession,
  saveAgentMemory,
  saveMessage,
  saveSession
} from './memory.service.js';

export const postMessage = async (req, res, next) => {
  try {
    const message = await saveMessage(req.user.id, req.body);
    res.status(201).json({ message: 'Message saved', message });
  } catch (error) {
    next(error);
  }
};

export const history = async (req, res, next) => {
  try {
    const messages = await getHistory(req.user.id, req.query.query || req.query.search || null);
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const historyBySession = async (req, res, next) => {
  try {
    const messages = await getHistoryBySession(req.user.id, req.params.sessionId);
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const removeHistory = async (req, res, next) => {
  try {
    await deleteHistoryBySessionService(req.user.id, req.params.sessionId);
    res.status(200).json({ message: 'History deleted' });
  } catch (error) {
    next(error);
  }
};

export const postSession = async (req, res, next) => {
  try {
    const session = await saveSession(req.user.id, req.body);
    res.status(201).json({ message: 'Session saved', session });
  } catch (error) {
    next(error);
  }
};

export const getSessionController = async (req, res, next) => {
  try {
    const session = await getSession(req.user.id, req.query.sessionId || req.params.sessionId || req.body?.sessionId);
    res.status(200).json({ session });
  } catch (error) {
    next(error);
  }
};

export const postAgentMemory = async (req, res, next) => {
  try {
    const memory = await saveAgentMemory(req.user.id, req.body.agentId, req.body);
    res.status(201).json({ message: 'Agent memory saved', memory });
  } catch (error) {
    next(error);
  }
};

export const getAgentMemoryController = async (req, res, next) => {
  try {
    const memory = await getAgentMemoryById(req.user.id, req.params.id);
    res.status(200).json({ memory });
  } catch (error) {
    next(error);
  }
};
