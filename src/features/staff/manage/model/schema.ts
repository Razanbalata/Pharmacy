import { z } from 'zod'
import { isMobileNumber, normalizePhone } from '@/shared/lib/validation'

export const staffSchema = z.object({
  name: z.string().trim().min(1, 'validation.required'),
  phone: z.string().refine(isMobileNumber, 'validation.phone').transform(normalizePhone),
  email: z.union([z.email('validation.email'), z.literal('')]).transform((value) => value || null),
  role: z.enum(['pharmacist', 'cashier']),
  discountLimit: z.coerce.number<string | number>().min(0).max(100),
  permissions: z.object({
    sellOnCredit: z.boolean(),
    seePurchasePrice: z.boolean(),
    approveCounts: z.boolean(),
  }),
})

export type StaffFormInput = z.input<typeof staffSchema>
export type StaffFormValues = z.output<typeof staffSchema>
