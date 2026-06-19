import { z } from 'zod';

export const promptSchema = z.object({
  name: z.string().trim().min(1, 'Prompt name is required'),
  module: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1, 'Prompt content is required'),
  metadata: z.record(z.any()).optional()
});

export const versionSchema = z.object({
  promptId: z.string().trim().min(1),
  content: z.string().trim().optional(),
  metadata: z.record(z.any()).optional()
});

export const restoreSchema = z.object({
  versionId: z.string().trim().min(1)
});
