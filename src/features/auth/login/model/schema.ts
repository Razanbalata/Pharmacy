import { z } from 'zod'

export const loginSchema = z.object({
  login: z.string().trim().min(1, 'validation.required'),
  password: z.string().min(1, 'validation.required'),
  remember: z.boolean(),
})

export type LoginValues = z.infer<typeof loginSchema>
