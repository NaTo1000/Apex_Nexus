import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().optional(),
  HOST: z.string().optional()
});

export const env = schema.parse(process.env);
