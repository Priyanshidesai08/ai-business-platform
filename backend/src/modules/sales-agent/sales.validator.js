import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  budget: z.string().optional(),
  urgency: z.string().optional(),
  companySize: z.string().optional(),
  interest: z.string().optional(),
  notes: z.string().optional(),
  followUp: z.string().optional(),
  status: z.string().optional()
});

export const scoreSchema = z.object({
  leadId: z.string().uuid()
});

export const followUpSchema = z.object({
  leadId: z.string().uuid()
});
