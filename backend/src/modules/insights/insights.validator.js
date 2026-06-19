import { z } from 'zod';

export const predictionSchema = z.object({
  horizon: z.string().trim().optional()
});

