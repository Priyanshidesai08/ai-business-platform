import { deleteFile, listFiles, retrieveKnowledge, searchKnowledge, uploadDocument } from './knowledge.service.js';

export const upload = async (req, res, next) => {
  try {
    const result = await uploadDocument(req.user.id, req.body);
    res.status(201).json({ message: 'Document uploaded', ...result });
  } catch (error) {
    next(error);
  }
};

export const files = async (req, res, next) => {
  try {
    const documents = await listFiles(req.user.id);
    res.status(200).json({ documents });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await deleteFile(req.user.id, req.body.documentId || req.query.documentId || req.params.documentId);
    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
};

export const search = async (req, res, next) => {
  try {
    const result = await searchKnowledge(req.user.id, req.query.query || '');
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const retrieve = async (req, res, next) => {
  try {
    const result = await retrieveKnowledge(req.user.id, req.body.documentIds || [], req.body.query || '');
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
