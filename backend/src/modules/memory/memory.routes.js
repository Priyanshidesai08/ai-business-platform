import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { agentMemorySchema, messageSchema, sessionSchema } from './memory.validator.js';
import {
  getAgentMemoryController,
  getSessionController,
  history,
  historyBySession,
  postAgentMemory,
  postMessage,
  postSession,
  removeHistory
} from './memory.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Memory
 *   description: Persistent conversation, session, and agent memory
 */

/**
 * @swagger
 * /memory/messages:
 *   post:
 *     summary: Save a conversation message
 *     tags: [Memory]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/messages', authenticate, validate(messageSchema), postMessage);

/**
 * @swagger
 * /memory/history:
 *   get:
 *     summary: Search conversation history
 *     tags: [Memory]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/history', authenticate, history);

/**
 * @swagger
 * /memory/history/{sessionId}:
 *   get:
 *     summary: Get conversation history for a session
 *     tags: [Memory]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/history/:sessionId', authenticate, historyBySession);

/**
 * @swagger
 * /memory/history/{sessionId}:
 *   delete:
 *     summary: Delete a conversation session history
 *     tags: [Memory]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/history/:sessionId', authenticate, removeHistory);

/**
 * @swagger
 * /memory/session:
 *   post:
 *     summary: Save active session memory
 *     tags: [Memory]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/session', authenticate, validate(sessionSchema), postSession);

/**
 * @swagger
 * /memory/session:
 *   get:
 *     summary: Restore session memory
 *     tags: [Memory]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/session', authenticate, getSessionController);

/**
 * @swagger
 * /memory/agent:
 *   post:
 *     summary: Save agent memory
 *     tags: [Memory]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/agent', authenticate, validate(agentMemorySchema), postAgentMemory);

/**
 * @swagger
 * /memory/agent/{id}:
 *   get:
 *     summary: Get agent memory by agent id
 *     tags: [Memory]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/agent/:id', authenticate, getAgentMemoryController);

export default router;
