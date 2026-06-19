import {
  createPromptRecord,
  deletePromptRecord,
  listPromptRecords,
  listPromptTemplates,
  listPromptVersionsRecord,
  restorePromptVersion,
  updatePromptRecord,
  versionPromptRecord
} from './prompts.service.js';

export const create = async (req, res, next) => {
  try {
    const prompt = await createPromptRecord(req.user.id, req.body);
    res.status(201).json({ message: 'Prompt saved', prompt });
  } catch (error) {
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const prompts = await listPromptRecords(req.user.id);
    res.status(200).json({ prompts });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const prompt = await updatePromptRecord(req.user.id, req.params.id, req.body);
    res.status(200).json({ message: 'Prompt updated', prompt });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await deletePromptRecord(req.user.id, req.params.id);
    res.status(200).json({ message: 'Prompt deleted' });
  } catch (error) {
    next(error);
  }
};

export const version = async (req, res, next) => {
  try {
    const promptVersion = await versionPromptRecord(req.user.id, req.body.promptId, req.body);
    res.status(201).json({ message: 'Version saved', promptVersion });
  } catch (error) {
    next(error);
  }
};

export const versions = async (req, res, next) => {
  try {
    const versions = await listPromptVersionsRecord(req.user.id, req.params.id);
    res.status(200).json({ versions });
  } catch (error) {
    next(error);
  }
};

export const restore = async (req, res, next) => {
  try {
    const result = await restorePromptVersion(req.user.id, req.body.versionId);
    res.status(200).json({ message: 'Version restored', ...result });
  } catch (error) {
    next(error);
  }
};

export const templates = async (req, res, next) => {
  try {
    const promptTemplates = await listPromptTemplates(req.user.id);
    res.status(200).json({ templates: promptTemplates });
  } catch (error) {
    next(error);
  }
};
