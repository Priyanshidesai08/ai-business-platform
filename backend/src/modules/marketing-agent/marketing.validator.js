import { z } from 'zod';

export const contentSchema = z.object({
  audience: z.string().min(2),
  objective: z.string().min(2),
  tone: z.string().min(2),
  platform: z.string().min(2)
});

export const regenerateSchema = z.object({
  content: z.any()
});
