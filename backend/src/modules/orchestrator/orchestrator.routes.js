import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { z } from 'zod';
import { notifications, run, runCompare, runDetail, runExport, runStream, runs, stats, telemetry, timings, workflowPreview } from './orchestrator.controller.js';

const router = Router();

const orchestrationSchema = z.object({
  request: z.string().min(5),
  goal: z.string().optional(),
  context: z.record(z.any()).default({}),
  approvals: z.array(z.object({
    agent: z.string(),
    approved: z.boolean().default(true),
    note: z.string().optional()
  })).default([]),
  workflow: z.object({
    order: z.array(z.enum(['sales', 'marketing', 'support', 'analytics'])).default([])
  }).default({ order: [] })
});

/**
 * @swagger
 * tags:
 *   name: Orchestrator
 *   description: Multi-agent routing, shared context, and task delegation
 */
/**
 * @swagger
 * /orchestrator/run:
 *   post:
 *     summary: Run a request through multiple agents
 *     tags: [Orchestrator]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [request]
 *             properties:
 *               request:
 *                 type: string
 *                 example: Generate campaign for new customer
 *               goal:
 *                 type: string
 *                 example: Create a campaign, qualify the lead, and summarize performance impact.
 *               context:
 *                 type: object
 *               approvals:
 *                 type: array
 *               workflow:
 *                 type: object
 *     responses:
 *       200:
 *         description: Orchestration completed
 */
router.post('/run', authenticate, validate(orchestrationSchema), run);
router.post('/stream', authenticate, validate(orchestrationSchema), runStream);
router.post('/preview', authenticate, validate(orchestrationSchema), workflowPreview);
/**
 * @swagger
 * /orchestrator/runs:
 *   get:
 *     summary: List orchestration runs
 *     tags: [Orchestrator]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Run list
 */
router.get('/runs', authenticate, runs);
router.get('/runs/:id', authenticate, runDetail);
router.get('/compare', authenticate, runCompare);
router.get('/runs/:id/export', authenticate, runExport);
router.get('/stats', authenticate, stats);
router.get('/notifications', authenticate, notifications);
router.get('/timings', authenticate, timings);
router.get('/telemetry/export', authenticate, telemetry);

export default router;
