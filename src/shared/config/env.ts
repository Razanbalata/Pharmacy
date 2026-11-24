import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.url().default('http://localhost:8000'),
})

/** Settings read once from the environment file and checked, so a typo fails at start-up. */
export const env = envSchema.parse(import.meta.env)
