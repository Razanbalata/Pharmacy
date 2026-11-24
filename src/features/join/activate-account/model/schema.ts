import { z } from 'zod'
import { isAcceptablePassword } from '@/shared/lib/validation'

export const activateSchema = z
  .object({
    email: z.union([z.email('validation.email'), z.literal('')]),
    password: z.string().refine(isAcceptablePassword, 'validation.password'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'validation.passwordsDiffer',
    path: ['confirm'],
  })

export type ActivateValues = z.infer<typeof activateSchema>
