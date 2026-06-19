import { z } from 'zod';

const stepSchema = z.object({
  agent: z.string().trim().min(1).default('sales'),
  action: z.string().trim().min(1).default('execute'),
  input: z.record(z.any()).default({}),
  output: z.record(z.any()).default({}),
  retry: z.number().int().min(0).default(0),
  timeout: z.number().int().min(0).default(0),
  condition: z.string().trim().default('')
});

export const workflowSchema = z.object({
  name: z.string().trim().min(1, 'Workflow name is required'),
  description: z.string().trim().optional(),
  triggerType: z.string().trim().optional(),
  status: z.string().trim().optional(),
  steps: z.array(stepSchema).default([])
});

export const workflowUpdateSchema = workflowSchema.partial();

export const workflowRunSchema = z.object({
  workflowId: z.string().trim().min(1).optional(),
  triggerType: z.string().trim().optional(),
  input: z.record(z.any()).default({})
});

export const workflowTriggerSchema = z.object({
  workflowId: z.string().trim().min(1).optional(),
  triggerType: z.string().trim().optional(),
  input: z.record(z.any()).default({})
});
