import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { z } from 'zod';
import { generate } from './ai.controller.js';

const router = Router();
const schema = z.object({
  module: z.string().min(2),
  template: z.string().min(2),
  input: z.record(z.any()).default({})
});

/**
 * @swagger
 * /ai/generate:
 *   post:
 *     summary: Generate structured AI output through the shared AI layer
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [module, template, input]
 *             properties:
 *               module:
 *                 type: string
 *                 example: sales
 *               template:
 *                 type: string
 *                 example: leadScore
 *               input:
 *                 type: object
 *                 example:
 *                   lead:
 *                     name: Acme
 *                     budget: 10000
 *     responses:
 *       200:
 *         description: Generated output
 *       401:
 *         description: Unauthorized
 */
router.post('/generate', authenticate, validate(schema), generate);

export default router;
