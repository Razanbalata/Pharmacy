import { z } from 'zod'
import { isMobileNumber, normalizePhone } from '@/shared/lib/validation'

const required = z.string().trim().min(1, 'validation.required')

export const joinSchema = z.object({
  pharmacyName: required,
  ownerName: required,
  city: required,
  phone: z.string().refine(isMobileNumber, 'validation.phone').transform(normalizePhone),
  licenseNumber: required,
  terms: z.literal(true, 'validation.terms'),
})

export type JoinFormInput = z.input<typeof joinSchema>
export type JoinFormValues = z.output<typeof joinSchema>
