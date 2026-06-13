import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { conversions, report } from './analytics.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Business analytics and conversions
 */
/**
 * @swagger
 * /analytics/report:
 *   get:
 *     summary: Get analytics report
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Analytics report
 */
router.get('/report', authenticate, report);
/**
 * @swagger
 * /analytics/conversions:
 *   get:
 *     summary: Get conversion summaries
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Conversion summary
 */
router.get('/conversions', authenticate, conversions);

export default router;
