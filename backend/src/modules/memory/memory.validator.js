import { z } from 'zod';

export const messageSchema = z.object({
  sessionId: z.string().trim().min(1).optional(),
  role: z.enum(['user', 'agent']),
  message: z.string().trim().min(1, 'Message is required'),
  metadata: z.record(z.any()).optional()
});

export const sessionSchema = z.object({
  sessionId: z.string().trim().min(1).optional(),
  activeWork: z.string().trim().optional().nullable(),
  draft: z.string().trim().optional().nullable(),
  timeoutAt: z.string().trim().optional().nullable(),
  metadata: z.record(z.any()).optional()
});

export const agentMemorySchema = z.object({
  agentId: z.string().trim().min(1, 'Agent id is required'),
  summary: z.string().trim().optional(),
  shortTerm: z.array(z.any()).optional(),
  longTerm: z.array(z.any()).optional(),
  decisions: z.array(z.any()).optional(),
  context: z.record(z.any()).optional()
});
