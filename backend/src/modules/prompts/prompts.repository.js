import { execute, fetchAll, fetchOne } from '../../shared/db.js';

export const createPrompt = async ({ userId, name, module, content, metadata }) =>
  fetchOne(
    `INSERT INTO prompts (user_id, name, module, content, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, module, content, metadata || {}]
  );

export const listPrompts = async ({ userId }) =>
  fetchAll('SELECT * FROM prompts WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);

export const getPromptById = async ({ userId, promptId }) =>
  fetchOne('SELECT * FROM prompts WHERE user_id = $1 AND id = $2', [userId, promptId]);

export const updatePromptById = async ({ userId, promptId, patch }) =>
  fetchOne(
    `UPDATE prompts
     SET name = COALESCE($3, name),
         module = COALESCE($4, module),
         content = COALESCE($5, content),
         metadata = COALESCE($6, metadata),
         updated_at = NOW()
     WHERE user_id = $1 AND id = $2
     RETURNING *`,
    [userId, promptId, patch.name ?? null, patch.module ?? null, patch.content ?? null, patch.metadata ?? null]
  );

export const deletePromptById = async ({ userId, promptId }) =>
  execute('DELETE FROM prompts WHERE user_id = $1 AND id = $2', [userId, promptId]);

export const createPromptVersion = async ({ userId, promptId, versionNumber, content, metadata }) =>
  fetchOne(
    `INSERT INTO prompt_versions (user_id, prompt_id, version_number, content, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, promptId, versionNumber, content, metadata || {}]
  );

export const listPromptVersions = async ({ userId, promptId }) =>
  fetchAll(
    'SELECT * FROM prompt_versions WHERE user_id = $1 AND prompt_id = $2 ORDER BY version_number DESC',
    [userId, promptId]
  );

export const getPromptVersionById = async ({ userId, versionId }) =>
  fetchOne('SELECT * FROM prompt_versions WHERE user_id = $1 AND id = $2', [userId, versionId]);

export const listTemplates = async ({ userId }) =>
  fetchAll('SELECT * FROM prompt_templates WHERE user_id = $1 OR user_id IS NULL ORDER BY name ASC', [userId]);
