import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { predictionSchema } from './insights.validator.js';
import { predict, summary, trends } from './insights.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Insights
 *   description: Business insights and prediction APIs
 */

/**
 * @swagger
 * /insights:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get business insights
 *     tags: [Insights]
 */
router.get('/', authenticate, summary);

/**
 * @swagger
 * /insights/predict:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Generate business predictions
 *     tags: [Insights]
 */
router.post('/predict', authenticate, validate(predictionSchema), predict);

/**
 * @swagger
 * /insights/trends:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get prediction trends
 *     tags: [Insights]
 */
router.get('/trends', authenticate, trends);

export default router;
