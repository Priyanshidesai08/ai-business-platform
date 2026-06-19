import test from 'node:test';
import assert from 'node:assert/strict';
import { createKnowledgeService } from '../../src/modules/knowledge/knowledge.service.js';
import { ApiError } from '../../src/utils/apiError.js';

test('uploadDocument chunks text content', async () => {
  const insertedChunks = [];
  const service = createKnowledgeService({
    insertDocumentFn: async (input) => ({ id: 'doc-1', ...input }),
    insertChunksFn: async (input) => insertedChunks.push(input)
  });

  const result = await service.uploadDocument('user-1', {
    filename: 'notes.txt',
    mimeType: 'text/plain',
    content: 'A'.repeat(900)
  });

  assert.equal(result.document.id, 'doc-1');
  assert.equal(result.chunks, 2);
  assert.equal(insertedChunks.length, 1);
  assert.equal(insertedChunks[0].chunks.length, 2);
});

test('deleteFile requires document id', async () => {
  const service = createKnowledgeService();
  await assert.rejects(
    service.deleteFile('user-1', ''),
    (error) => error instanceof ApiError && error.statusCode === 400
  );
});

test('retrieve ranks matching chunks first', async () => {
  const service = createKnowledgeService({
    getDocumentByIdFn: async ({ documentId }) => ({
      id: documentId,
      filename: 'guide.txt',
      text_content: 'alpha beta gamma'
    }),
    listChunksByDocumentFn: async () => ([
      { id: 'c1', document_id: 'doc-1', chunk_index: 0, chunk_text: 'beta answer' },
      { id: 'c2', document_id: 'doc-1', chunk_index: 1, chunk_text: 'other text' }
    ])
  });

  const result = await service.retrieve('user-1', ['doc-1'], 'beta');
  assert.equal(result.chunks[0].chunk_text, 'beta answer');
  assert.match(result.context, /beta answer/);
});
