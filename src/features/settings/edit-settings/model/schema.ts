import { z } from 'zod'

const required = z.string().trim().min(1, 'validation.required')
const whole = (min: number, max: number) =>
  z.coerce.number<string | number>().int().min(min).max(max)

export const settingsSchema = z.object({
  profile: z.object({
    name: required,
    city: required,
    address: required,
    phone: required,
    licenseNumber: z.string().trim(),
  }),
  sale: z.object({
    paymentMethods: z.object({ cash: z.boolean(), bankApp: z.boolean(), credit: z.boolean() }),
    bankAppNames: z.string().trim(),
    defaultDebtLimit: whole(0, 100_000),
    returnDays: whole(0, 365),
    shiftsEnabled: z.boolean(),
    sellByUnit: z.boolean(),
    sellAtZero: z.boolean(),
  }),
  stock: z.object({
    expiryAlertDays: whole(1, 730),
    defaultMinStock: whole(0, 10_000),
    dailyDigest: z.boolean(),
  }),
  print: z.object({
    receiptSize: z.enum(['80mm', '58mm', 'A4']),
    autoPrint: z.boolean(),
    footer: z.string().trim().max(200),
    labelSize: z.enum(['38x25', '50x30']),
  }),
})

export type SettingsFormInput = z.input<typeof settingsSchema>
export type SettingsFormValues = z.output<typeof settingsSchema>
