import { execute, fetchAll, fetchOne } from '../../shared/db.js';

export const insertDocument = async ({ userId, filename, mimeType, textContent, metadata, status }) =>
  fetchOne(
    `INSERT INTO documents (user_id, filename, mime_type, text_content, metadata, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, filename, mimeType, textContent, metadata || {}, status || 'ready']
  );

export const listDocuments = async ({ userId }) =>
  fetchAll('SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

export const getDocumentById = async ({ userId, documentId }) =>
  fetchOne('SELECT * FROM documents WHERE user_id = $1 AND id = $2', [userId, documentId]);

export const deleteDocumentById = async ({ userId, documentId }) =>
  execute('DELETE FROM documents WHERE user_id = $1 AND id = $2', [userId, documentId]);

export const insertChunks = async ({ documentId, chunks }) => {
  for (const chunk of chunks) {
    await fetchOne(
      `INSERT INTO document_chunks (document_id, chunk_index, chunk_text, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [documentId, chunk.chunkIndex, chunk.chunkText, chunk.metadata || {}]
    );
  }
};

export const listChunksByDocument = async ({ documentId }) =>
  fetchAll('SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index ASC', [documentId]);

export const searchDocuments = async ({ userId, query }) =>
  fetchAll(
    `SELECT d.*, COUNT(c.id)::int AS chunk_count
     FROM documents d
     LEFT JOIN document_chunks c ON c.document_id = d.id
     WHERE d.user_id = $1
       AND ($2::text IS NULL OR d.filename ILIKE '%' || $2 || '%' OR d.text_content ILIKE '%' || $2 || '%')
     GROUP BY d.id
     ORDER BY d.created_at DESC`,
    [userId, query || null]
  );

export const searchChunks = async ({ userId, query }) =>
  fetchAll(
    `SELECT c.*, d.filename, d.mime_type
     FROM document_chunks c
     INNER JOIN documents d ON d.id = c.document_id
     WHERE d.user_id = $1
       AND ($2::text IS NULL OR c.chunk_text ILIKE '%' || $2 || '%' OR d.filename ILIKE '%' || $2 || '%')
     ORDER BY c.chunk_index ASC`,
    [userId, query || null]
  );
