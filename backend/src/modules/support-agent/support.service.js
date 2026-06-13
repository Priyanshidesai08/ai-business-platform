import { execute, fetchAll, fetchOne } from '../../shared/db.js';
import { generateAiResponse } from '../ai/ai.service.js';
import { templates } from '../ai/prompt-templates.js';

export const createTicket = async (userId, ticket) =>
  fetchOne(
    `INSERT INTO tickets (user_id, customer_name, subject, status, priority, history, ai_response)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      userId,
      ticket.customerName || null,
      ticket.subject,
      ticket.status || 'open',
      ticket.priority || 'normal',
      JSON.stringify(ticket.history || []),
      ticket.aiResponse || ''
    ]
  );

export const listTickets = async (userId) =>
  fetchAll(`SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);

export const chatSupport = async (userId, message, history = []) => {
  const prompt = templates.supportChat({ message, history });
  const result = await generateAiResponse({
    userId,
    module: 'support',
    prompt,
    cacheKey: `${userId}:support:${JSON.stringify({ message, history })}`,
    metadata: { logAction: 'support.chat', meta: { message } }
  });
  return result.response;
};

export const appendTicketMessage = async (userId, ticketId, message) =>
  fetchOne(
    `UPDATE tickets SET history = history || $3::jsonb, updated_at = NOW()
     WHERE user_id = $1 AND id = $2
     RETURNING *`,
    [userId, ticketId, JSON.stringify([{ message, createdAt: new Date().toISOString() }])]
  );
