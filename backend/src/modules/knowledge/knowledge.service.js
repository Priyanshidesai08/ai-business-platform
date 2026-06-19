import { ApiError } from '../../utils/apiError.js';
import {
  deleteDocumentById,
  getDocumentById,
  insertChunks,
  insertDocument,
  listChunksByDocument,
  listDocuments,
  searchChunks,
  searchDocuments
} from './knowledge.repository.js';

const normalizeText = (value) => (typeof value === 'string' ? value : '');

const chunkText = (text, size = 800) => {
  const source = normalizeText(text).trim();
  if (!source) return [];
  const chunks = [];
  for (let index = 0; index < source.length; index += size) {
    chunks.push(source.slice(index, index + size));
  }
  return chunks;
};

const extractFromUpload = (file) => {
  const filename = file?.filename || file?.name;
  if (!filename) throw new ApiError(400, 'Filename is required');
  const mimeType = file?.mimeType || file?.type || 'text/plain';
  const rawContent = file?.content || file?.text || file?.body || '';
  const textContent = normalizeText(rawContent);
  return { filename, mimeType, textContent };
};

export const createKnowledgeService = ({
  insertDocumentFn = insertDocument,
  insertChunksFn = insertChunks,
  listDocumentsFn = listDocuments,
  getDocumentByIdFn = getDocumentById,
  deleteDocumentByIdFn = deleteDocumentById,
  searchDocumentsFn = searchDocuments,
  searchChunksFn = searchChunks,
  listChunksByDocumentFn = listChunksByDocument
} = {}) => ({
  uploadDocument: async (userId, file) => {
    const { filename, mimeType, textContent } = extractFromUpload(file);
    const metadata = {
      originalName: file?.originalName || filename,
      size: file?.size || textContent.length,
      uploadedBy: userId
    };
    const document = await insertDocumentFn({
      userId,
      filename,
      mimeType,
      textContent,
      metadata,
      status: 'ready'
    });
    const chunks = chunkText(textContent).map((chunkTextValue, index) => ({
      chunkIndex: index,
      chunkText: chunkTextValue,
      metadata: { filename, mimeType }
    }));
    if (chunks.length) await insertChunksFn({ documentId: document.id, chunks });
    return {
      document,
      chunks: chunks.length
    };
  },
  listFiles: async (userId) => listDocumentsFn({ userId }),
  deleteFile: async (userId, documentId) => {
    if (!documentId) throw new ApiError(400, 'Document id is required');
    await deleteDocumentByIdFn({ userId, documentId });
  },
  search: async (userId, query) => {
    const documents = await searchDocumentsFn({ userId, query });
    const chunks = await searchChunksFn({ userId, query });
    return { documents, chunks };
  },
  retrieve: async (userId, documentIds = [], query = '') => {
    const selectedDocuments = [];
    for (const documentId of documentIds) {
      const document = await getDocumentByIdFn({ userId, documentId });
      if (document) selectedDocuments.push(document);
    }
    const rankedChunks = [];
    for (const document of selectedDocuments) {
      const chunks = await listChunksByDocumentFn({ documentId: document.id });
      for (const chunk of chunks) {
        const relevance = [document.filename, document.text_content, chunk.chunk_text]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes((query || '').toLowerCase())
          ? 1
          : 0.5;
        rankedChunks.push({
          ...chunk,
          filename: document.filename,
          relevance
        });
      }
    }
    rankedChunks.sort((a, b) => b.relevance - a.relevance || a.chunk_index - b.chunk_index);
    return {
      query,
      documents: selectedDocuments,
      chunks: rankedChunks.slice(0, 5),
      context: rankedChunks.slice(0, 5).map((chunk) => chunk.chunk_text).join('\n\n')
    };
  }
});

const knowledgeService = createKnowledgeService();

export const uploadDocument = knowledgeService.uploadDocument;
export const listFiles = knowledgeService.listFiles;
export const deleteFile = knowledgeService.deleteFile;
export const searchKnowledge = knowledgeService.search;
export const retrieveKnowledge = knowledgeService.retrieve;
