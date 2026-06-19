import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createEvent, createFeedback, createMetric, dashboard, events, feedback, metrics } from './monitoring.controller.js';

const router = Router();

const metricSchema = z.object({
  metricKey: z.string().min(1),
  metricValue: z.number().optional().default(0),
  dimension: z.record(z.any()).optional().default({})
});

const eventSchema = z.object({
  source: z.string().min(1),
  eventType: z.string().min(1),
  status: z.string().min(1).optional().default('info'),
  payload: z.record(z.any()).optional().default({})
});

const feedbackSchema = z.object({
  source: z.string().min(1),
  rating: z.number().min(1).max(5).optional().default(5),
  comments: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([])
});

/**
 * @swagger
 * tags:
 *   name: Monitoring
 *   description: Platform telemetry, metrics, and executive dashboard data
 */

/**
 * @swagger
 * /monitoring/dashboard:
 *   get:
 *     summary: Get monitoring dashboard data
 *     tags: [Monitoring]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Monitoring dashboard payload
 */
router.get('/dashboard', authenticate, dashboard);

/**
 * @swagger
 * /monitoring/metrics:
 *   get:
 *     summary: List monitoring metrics
 *     tags: [Monitoring]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/metrics', authenticate, metrics);

/**
 * @swagger
 * /monitoring/events:
 *   get:
 *     summary: List monitoring events
 *     tags: [Monitoring]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/events', authenticate, events);

/**
 * @swagger
 * /monitoring/feedback:
 *   get:
 *     summary: List monitoring feedback
 *     tags: [Monitoring]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/feedback', authenticate, feedback);

/**
 * @swagger
 * /monitoring/metric:
 *   post:
 *     summary: Create a monitoring metric
 *     tags: [Monitoring]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/metric', authenticate, validate(metricSchema), createMetric);

/**
 * @swagger
 * /monitoring/event:
 *   post:
 *     summary: Create a monitoring event
 *     tags: [Monitoring]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/event', authenticate, validate(eventSchema), createEvent);

/**
 * @swagger
 * /monitoring/feedback:
 *   post:
 *     summary: Submit product feedback
 *     tags: [Monitoring]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/feedback', authenticate, validate(feedbackSchema), createFeedback);

export default router;
