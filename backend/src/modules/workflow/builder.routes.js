import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  builderCreate,
  builderDetail,
  builderList,
  builderLogs,
  builderPause,
  builderRemove,
  builderResume,
  builderRun,
  builderRuns,
  builderStatus,
  builderStop,
  builderUpdate
} from './workflow.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Workflow Builder
 *   description: Persisted workflow builder definitions and canvas graphs
 *
 * components:
 *   schemas:
 *     WorkflowBuilderNode:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *         label:
 *           type: string
 *         position:
 *           type: object
 *         config:
 *           type: object
 *     WorkflowBuilderEdge:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         from:
 *           type: string
 *         to:
 *           type: string
 *     WorkflowBuilderDefinition:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         nodes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WorkflowBuilderNode'
 *         edges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WorkflowBuilderEdge'
 */

/**
 * @swagger
 * /builder/workflow:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Workflow Builder]
 *     summary: List saved workflow builders
 *     responses:
 *       200:
 *         description: Workflow builders returned
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [Workflow Builder]
 *     summary: Save a workflow builder graph
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkflowBuilderDefinition'
 *     responses:
 *       201:
 *         description: Workflow saved
 */
router.get('/workflow', authenticate, builderList);
router.post('/workflow', authenticate, builderCreate);
router.get('/workflow/:id', authenticate, builderDetail);
router.put('/workflow/:id', authenticate, builderUpdate);
router.delete('/workflow/:id', authenticate, builderRemove);
router.post('/run', authenticate, builderRun);
router.post('/pause', authenticate, builderPause);
router.post('/resume', authenticate, builderResume);
router.post('/stop', authenticate, builderStop);
router.get('/status', authenticate, builderStatus);
router.get('/logs', authenticate, builderLogs);
router.get('/runs', authenticate, builderRuns);


export default router;
