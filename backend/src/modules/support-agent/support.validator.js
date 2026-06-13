import { z } from 'zod';

export const chatSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.any()).optional()
});

export const ticketSchema = z.object({
  customerName: z.string().optional(),
  subject: z.string().min(2),
  status: z.enum(['open', 'pending', 'resolved']).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  history: z.array(z.any()).optional(),
  aiResponse: z.string().optional()
});
