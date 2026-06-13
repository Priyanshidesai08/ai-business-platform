import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { adcopy, campaign, campaigns, email, post, regenerateCampaign } from './marketing.controller.js';
import { contentSchema, regenerateSchema } from './marketing.validator.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Marketing
 *   description: Campaign, post, email, and ad copy generation
 */
/**
 * @swagger
 * /marketing/post:
 *   post:
 *     summary: Generate a social post
 *     tags: [Marketing]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarketingInput'
 *     responses:
 *       200:
 *         description: Generated post
 */
router.post('/post', authenticate, validate(contentSchema), post);
/**
 * @swagger
 * /marketing/email:
 *   post:
 *     summary: Generate a marketing email
 *     tags: [Marketing]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarketingInput'
 *     responses:
 *       200:
 *         description: Generated email
 */
router.post('/email', authenticate, validate(contentSchema), email);
/**
 * @swagger
 * /marketing/campaign:
 *   post:
 *     summary: Generate a campaign
 *     tags: [Marketing]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarketingInput'
 *     responses:
 *       200:
 *         description: Generated campaign
 */
router.post('/campaign', authenticate, validate(contentSchema), campaign);
/**
 * @swagger
 * /marketing/adcopy:
 *   post:
 *     summary: Generate ad copy
 *     tags: [Marketing]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarketingInput'
 *     responses:
 *       200:
 *         description: Generated ad copy
 */
router.post('/adcopy', authenticate, validate(contentSchema), adcopy);
/**
 * @swagger
 * /marketing/campaigns:
 *   get:
 *     summary: List campaigns
 *     tags: [Marketing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Campaign list
 */
router.get('/campaigns', authenticate, campaigns);
/**
 * @swagger
 * /marketing/campaigns/{id}:
 *   put:
 *     summary: Update campaign content
 *     tags: [Marketing]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Campaign updated
 */
router.put('/campaigns/:id', authenticate, validate(regenerateSchema), regenerateCampaign);

export default router;
