import { z } from 'zod';

export const uploadSchema = z.object({
  filename: z.string().trim().min(1),
  mimeType: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1, 'File content is required'),
  originalName: z.string().trim().optional(),
  size: z.number().int().nonnegative().optional(),
  metadata: z.record(z.any()).optional()
});

export const deleteSchema = z.object({
  documentId: z.string().trim().min(1)
});

export const searchSchema = z.object({
  query: z.string().trim().optional()
});

export const retrieveSchema = z.object({
  documentIds: z.array(z.string().trim().min(1)).optional(),
  query: z.string().trim().optional()
});
