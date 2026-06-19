import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { deleteSchema, retrieveSchema, searchSchema, uploadSchema } from './knowledge.validator.js';
import { files, remove, retrieve, search, upload } from './knowledge.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Knowledge
 *   description: Document upload, search, and retrieval
 */

/**
 * @swagger
 * /knowledge/upload:
 *   post:
 *     summary: Upload a knowledge document
 *     tags: [Knowledge]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/upload', authenticate, validate(uploadSchema), upload);
router.get('/files', authenticate, files);
router.delete('/file', authenticate, validate(deleteSchema), remove);
router.get('/search', authenticate, validate(searchSchema), search);
router.post('/retrieve', authenticate, validate(retrieveSchema), retrieve);

export default router;
