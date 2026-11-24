import { z } from 'zod';

const serviceStatus = z.enum(['up', 'down']);

export const healthSchema = z.object({
  status: z.enum(['ok', 'error']),
  db: serviceStatus,
  redis: serviceStatus,
});

export type Health = z.infer<typeof healthSchema>;

export type ServiceStatus = z.infer<typeof serviceStatus>;
