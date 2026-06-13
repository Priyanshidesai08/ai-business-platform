import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { followUpSchema, leadSchema, scoreSchema } from './sales.validator.js';
import {
  createLead,
  followUpLead,
  getLead,
  listLeads,
  removeLead,
  scoreLead,
  updateLead
} from './sales.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Lead capture, scoring, and follow-up generation
 */
/**
 * @swagger
 * /sales/leads:
 *   post:
 *     summary: Create a lead
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name: { type: string, example: Acme Buyer }
 *               email: { type: string, example: buyer@example.com }
 *               company: { type: string, example: Acme }
 *               budget: { type: string, example: 10000 }
 *               urgency: { type: string, example: high }
 *               companySize: { type: string, example: 50 }
 *               interest: { type: string, example: automation }
 *               notes: { type: string, example: Interested in rollout }
 *     responses:
 *       201:
 *         description: Lead created
 *       401:
 *         description: Unauthorized
 */
router.post('/leads', authenticate, validate(leadSchema), createLead);
/**
 * @swagger
 * /sales/leads:
 *   get:
 *     summary: List leads
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lead list
 */
router.get('/leads', authenticate, listLeads);
/**
 * @swagger
 * /sales/leads/{id}:
 *   get:
 *     summary: Get lead detail
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lead detail
 *       404:
 *         description: Lead not found
 */
router.get('/leads/:id', authenticate, getLead);
/**
 * @swagger
 * /sales/leads/{id}:
 *   put:
 *     summary: Update a lead
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lead updated
 */
router.put('/leads/:id', authenticate, validate(leadSchema.partial()), updateLead);
/**
 * @swagger
 * /sales/leads/{id}:
 *   delete:
 *     summary: Delete a lead
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Lead deleted
 */
router.delete('/leads/:id', authenticate, removeLead);
/**
 * @swagger
 * /sales/score:
 *   post:
 *     summary: Score a lead using AI
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadId]
 *             properties:
 *               leadId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Lead scored
 */
router.post('/score', authenticate, validate(scoreSchema), scoreLead);
/**
 * @swagger
 * /sales/followup:
 *   post:
 *     summary: Generate a follow-up email and next action
 *     tags: [Sales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadId]
 *             properties:
 *               leadId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Follow-up generated
 */
router.post('/followup', authenticate, validate(followUpSchema), followUpLead);

export default router;
