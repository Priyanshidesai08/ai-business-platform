import { ApiError } from '../../utils/apiError.js';
import {
  deleteHistoryBySession,
  deleteSessionMemoryBySession,
  getAgentMemory,
  getSessionMemory,
  insertMessage,
  listHistory,
  listHistoryBySession,
  upsertAgentMemory,
  upsertSessionMemory
} from './memory.repository.js';

const normalizeSessionId = (sessionId, fallbackUserId) => sessionId || `session-${fallbackUserId}`;

export const createMemoryService = ({
  insertMessageFn = insertMessage,
  listHistoryFn = listHistory,
  listHistoryBySessionFn = listHistoryBySession,
  deleteHistoryBySessionFn = deleteHistoryBySession,
  deleteSessionMemoryBySessionFn = deleteSessionMemoryBySession,
  upsertSessionMemoryFn = upsertSessionMemory,
  getSessionMemoryFn = getSessionMemory,
  upsertAgentMemoryFn = upsertAgentMemory,
  getAgentMemoryFn = getAgentMemory
} = {}) => ({
  saveMessage: async (userId, payload) => {
    if (!payload?.message?.trim()) throw new ApiError(400, 'Message is required');
    if (!payload?.role) throw new ApiError(400, 'Role is required');
    const sessionId = normalizeSessionId(payload.sessionId, userId);
    return insertMessageFn({
      userId,
      sessionId,
      role: payload.role,
      message: payload.message.trim(),
      metadata: payload.metadata || {}
    });
  },
  getHistory: async (userId, query) => listHistoryFn({ userId, query }),
  getHistoryBySession: async (userId, sessionId) => {
    if (!sessionId) throw new ApiError(400, 'Session id is required');
    return listHistoryBySessionFn({ userId, sessionId });
  },
  deleteHistoryBySession: async (userId, sessionId) => {
    if (!sessionId) throw new ApiError(400, 'Session id is required');
    await deleteHistoryBySessionFn({ userId, sessionId });
    await deleteSessionMemoryBySessionFn({ userId, sessionId });
  },
  saveSession: async (userId, payload) => {
    const sessionId = normalizeSessionId(payload?.sessionId, userId);
    return upsertSessionMemoryFn({
      userId,
      sessionId,
      payload: {
        activeWork: payload?.activeWork || null,
        draft: payload?.draft || null,
        timeoutAt: payload?.timeoutAt || null,
        metadata: payload?.metadata || {}
      }
    });
  },
  getSession: async (userId, sessionId) => {
    const nextSessionId = normalizeSessionId(sessionId, userId);
    return getSessionMemoryFn({ userId, sessionId: nextSessionId });
  },
  saveAgentMemory: async (userId, agentId, payload) => {
    if (!agentId) throw new ApiError(400, 'Agent id is required');
    return upsertAgentMemoryFn({
      userId,
      agentId,
      payload: {
        summary: payload?.summary || '',
        shortTerm: payload?.shortTerm || [],
        longTerm: payload?.longTerm || [],
        decisions: payload?.decisions || [],
        context: payload?.context || {}
      }
    });
  },
  getAgentMemory: async (userId, agentId) => {
    if (!agentId) throw new ApiError(400, 'Agent id is required');
    return getAgentMemoryFn({ userId, agentId });
  }
});

const memoryService = createMemoryService();

export const saveMessage = memoryService.saveMessage;
export const getHistory = memoryService.getHistory;
export const getHistoryBySession = memoryService.getHistoryBySession;
export const deleteHistoryBySessionService = memoryService.deleteHistoryBySession;
export const saveSession = memoryService.saveSession;
export const getSession = memoryService.getSession;
export const saveAgentMemory = memoryService.saveAgentMemory;
export const getAgentMemoryById = memoryService.getAgentMemory;
