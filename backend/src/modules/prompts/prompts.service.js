import { ApiError } from '../../utils/apiError.js';
import {
  createPrompt,
  createPromptVersion,
  deletePromptById,
  getPromptById,
  getPromptVersionById,
  listPromptVersions,
  listPrompts,
  listTemplates,
  updatePromptById
} from './prompts.repository.js';

export const createPromptService = ({
  createPromptFn = createPrompt,
  listPromptsFn = listPrompts,
  getPromptByIdFn = getPromptById,
  updatePromptByIdFn = updatePromptById,
  deletePromptByIdFn = deletePromptById,
  createPromptVersionFn = createPromptVersion,
  listPromptVersionsFn = listPromptVersions,
  getPromptVersionByIdFn = getPromptVersionById,
  listTemplatesFn = listTemplates
} = {}) => ({
  createPrompt: async (userId, payload) => {
    if (!payload?.name?.trim()) throw new ApiError(400, 'Prompt name is required');
    if (!payload?.content?.trim()) throw new ApiError(400, 'Prompt content is required');
    return createPromptFn({
      userId,
      name: payload.name.trim(),
      module: payload.module?.trim() || 'shared',
      content: payload.content,
      metadata: payload.metadata || {}
    });
  },
  listPrompts: async (userId) => listPromptsFn({ userId }),
  updatePrompt: async (userId, promptId, payload) => {
    const current = await getPromptByIdFn({ userId, promptId });
    if (!current) throw new ApiError(404, 'Prompt not found');
    return updatePromptByIdFn({
      userId,
      promptId,
      patch: {
        name: payload.name?.trim() || null,
        module: payload.module?.trim() || null,
        content: payload.content?.trim() || null,
        metadata: payload.metadata ?? null
      }
    });
  },
  deletePrompt: async (userId, promptId) => {
    const current = await getPromptByIdFn({ userId, promptId });
    if (!current) throw new ApiError(404, 'Prompt not found');
    await deletePromptByIdFn({ userId, promptId });
  },
  versionPrompt: async (userId, promptId, payload) => {
    const current = await getPromptByIdFn({ userId, promptId });
    if (!current) throw new ApiError(404, 'Prompt not found');
    const versions = await listPromptVersionsFn({ userId, promptId });
    const nextVersion = (versions[0]?.version_number || 0) + 1;
    return createPromptVersionFn({
      userId,
      promptId,
      versionNumber: nextVersion,
      content: payload?.content || current.content,
      metadata: payload?.metadata || {}
    });
  },
  listVersions: async (userId, promptId) => listPromptVersionsFn({ userId, promptId }),
  restoreVersion: async (userId, versionId) => {
    const version = await getPromptVersionByIdFn({ userId, versionId });
    if (!version) throw new ApiError(404, 'Version not found');
    const prompt = await getPromptByIdFn({ userId, promptId: version.prompt_id });
    if (!prompt) throw new ApiError(404, 'Prompt not found');
    const updated = await updatePromptByIdFn({
      userId,
      promptId: version.prompt_id,
      patch: { content: version.content, metadata: version.metadata }
    });
    return { prompt: updated, version };
  },
  listTemplates: async (userId) => listTemplatesFn({ userId })
});

const promptService = createPromptService();

export const createPromptRecord = promptService.createPrompt;
export const listPromptRecords = promptService.listPrompts;
export const updatePromptRecord = promptService.updatePrompt;
export const deletePromptRecord = promptService.deletePrompt;
export const versionPromptRecord = promptService.versionPrompt;
export const listPromptVersionsRecord = promptService.listVersions;
export const restorePromptVersion = promptService.restoreVersion;
export const listPromptTemplates = promptService.listTemplates;
