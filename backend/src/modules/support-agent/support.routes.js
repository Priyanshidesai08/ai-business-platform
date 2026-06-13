import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { chat, create, tickets } from './support.controller.js';
import { chatSchema, ticketSchema } from './support.validator.js';

const faqItems = [
  {
    id: 'faq-1',
    question: 'How do I reset my account?',
    answer: 'Use the profile flow or contact support if you need manual verification.'
  },
  {
    id: 'faq-2',
    question: 'Where do I see campaign results?',
    answer: 'Open Analytics to review reports, conversion tracking, and recent activity.'
  },
  {
    id: 'faq-3',
    question: 'How do I create a support ticket?',
    answer: 'Send a message in the support console and click Ticket to persist the issue.'
  }
];

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Support
 *   description: AI support chat and ticket management
 */
/**
 * @swagger
 * /support/chat:
 *   post:
 *     summary: Chat with support AI
 *     tags: [Support]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupportChatInput'
 *     responses:
 *       200:
 *         description: Support response
 */
router.post('/chat', authenticate, validate(chatSchema), chat);
/**
 * @swagger
 * /support/tickets:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Support]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TicketInput'
 *     responses:
 *       201:
 *         description: Ticket created
 */
router.post('/tickets', authenticate, validate(ticketSchema), create);
/**
 * @swagger
 * /support/tickets:
 *   get:
 *     summary: List support tickets
 *     tags: [Support]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Ticket list
 */
router.get('/tickets', authenticate, tickets);

/**
 * @swagger
 * /support/faq:
 *   get:
 *     summary: List support FAQs
 *     tags: [Support]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: FAQ list
 *         content:
 *           application/json:
 *             example:
 *               faqs:
 *                 - id: faq-1
 *                   question: How do I reset my account?
 *                   answer: Use the profile flow or contact support if you need manual verification.
 */
router.get('/faq', authenticate, (_req, res) => {
  res.status(200).json({ faqs: faqItems });
});

export default router;
