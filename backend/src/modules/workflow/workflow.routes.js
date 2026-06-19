import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { workflowRunSchema, workflowSchema, workflowTriggerSchema, workflowUpdateSchema } from './workflow.validator.js';
import { cancel, create, detail, list, logs, pause, retry, remove, resume, run, runs, status, trigger, update } from './workflow.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Workflow
 *   description: Central workflow engine for executable business workflows
 *
 * components:
 *   schemas:
 *     WorkflowRun:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         workflow_id:
 *           type: string
 *         user_id:
 *           type: string
 *         status:
 *           type: string
 *           example: running
 *         trigger_type:
 *           type: string
 *           example: manual
 *         current_step:
 *           type: integer
 *           example: 2
 *     WorkflowLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         run_id:
 *           type: string
 *         agent:
 *           type: string
 *         action:
 *           type: string
 *         status:
 *           type: string
 *         message:
 *           type: string
 */

router.post('/', authenticate, validate(workflowSchema), create);
router.get('/', authenticate, list);
/**
 * @swagger
 * /workflow/run:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Run a workflow immediately
 *     tags: [Workflow]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkflowInput'
 *     responses:
 *       200:
 *         description: Workflow run completed
 */
router.post('/run', authenticate, validate(workflowRunSchema), run);
/**
 * @swagger
 * /workflow/trigger:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Queue a workflow trigger
 *     tags: [Workflow]
 */
router.post('/trigger', authenticate, validate(workflowTriggerSchema), trigger);
/**
 * @swagger
 * /workflow/status:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Read the latest workflow execution status
 *     tags: [Workflow]
 */
router.get('/status', authenticate, status);
/**
 * @swagger
 * /workflow/logs:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Read workflow execution logs
 *     tags: [Workflow]
 */
router.get('/logs', authenticate, logs);
/**
 * @swagger
 * /workflow/runs:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: List workflow execution runs
 *     tags: [Workflow]
 */
router.get('/runs', authenticate, runs);
router.post('/:id/pause', authenticate, pause);
router.post('/:id/resume', authenticate, resume);
router.post('/:id/cancel', authenticate, cancel);
router.post('/:id/retry', authenticate, retry);
router.get('/:id', authenticate, detail);
router.put('/:id', authenticate, validate(workflowUpdateSchema), update);
router.delete('/:id', authenticate, remove);

export default router;
