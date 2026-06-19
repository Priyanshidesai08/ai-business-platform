import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { create, list, remove, restore, templates, update, version, versions } from './prompts.controller.js';
import { promptSchema, restoreSchema, versionSchema } from './prompts.validator.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Prompts
 *   description: Prompt editor, versioning, templates, and history
 */

router.post('/', authenticate, validate(promptSchema), create);
router.get('/', authenticate, list);
router.put('/:id', authenticate, validate(promptSchema.partial()), update);
router.delete('/:id', authenticate, remove);
router.post('/version', authenticate, validate(versionSchema), version);
router.get('/:id/versions', authenticate, versions);
router.post('/restore', authenticate, validate(restoreSchema), restore);
router.get('/templates', authenticate, templates);

export default router;
