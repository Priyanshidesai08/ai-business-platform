import { execute, fetchAll, fetchOne } from '../../shared/db.js';

export const insertMessage = async ({ userId, sessionId, role, message, metadata }) =>
  fetchOne(
    `INSERT INTO conversation_history (user_id, session_id, role, message, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, sessionId, role, message, metadata || {}]
  );

export const listHistory = async ({ userId, query }) =>
  fetchAll(
    `SELECT *
     FROM conversation_history
     WHERE user_id = $1
       AND ($2::text IS NULL OR message ILIKE '%' || $2 || '%' OR session_id ILIKE '%' || $2 || '%')
     ORDER BY created_at DESC`,
    [userId, query || null]
  );

export const listHistoryBySession = async ({ userId, sessionId }) =>
  fetchAll(
    `SELECT *
     FROM conversation_history
     WHERE user_id = $1 AND session_id = $2
     ORDER BY created_at ASC`,
    [userId, sessionId]
  );

export const deleteHistoryBySession = async ({ userId, sessionId }) =>
  execute('DELETE FROM conversation_history WHERE user_id = $1 AND session_id = $2', [userId, sessionId]);

export const deleteSessionMemoryBySession = async ({ userId, sessionId }) =>
  execute('DELETE FROM session_memory WHERE user_id = $1 AND session_id = $2', [userId, sessionId]);

export const upsertSessionMemory = async ({ userId, sessionId, payload }) =>
  fetchOne(
    `INSERT INTO session_memory (user_id, session_id, payload)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, session_id)
     DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
     RETURNING *`,
    [userId, sessionId, payload || {}]
  );

export const getSessionMemory = async ({ userId, sessionId }) =>
  fetchOne(
    `SELECT *
     FROM session_memory
     WHERE user_id = $1 AND session_id = $2`,
    [userId, sessionId]
  );

export const upsertAgentMemory = async ({ userId, agentId, payload }) =>
  fetchOne(
    `INSERT INTO agent_memory (user_id, agent_id, payload, summary, short_term, long_term)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, agent_id)
     DO UPDATE SET
       payload = EXCLUDED.payload,
       summary = EXCLUDED.summary,
       short_term = EXCLUDED.short_term,
       long_term = EXCLUDED.long_term,
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      agentId,
      JSON.stringify(payload || {}),
      payload?.summary || '',
      JSON.stringify(payload?.shortTerm || []),
      JSON.stringify(payload?.longTerm || [])
    ]
  );

export const getAgentMemory = async ({ userId, agentId }) =>
  fetchOne(
    `SELECT *
     FROM agent_memory
     WHERE user_id = $1 AND agent_id = $2`,
    [userId, agentId]
  );
