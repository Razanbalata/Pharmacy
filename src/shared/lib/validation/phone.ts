import { normalizeArabic } from '@/shared/lib/arabic-search'

/** Spaces, dashes and Arabic digits out: "٠٥٩٩ ٩٢٠-٣٠٧" → "0599920307". */
export function normalizePhone(value: string): string {
  return normalizeArabic(value).replace(/[\s-]/g, '')
}

/** Palestinian mobile numbers: 059 or 056, then 7 digits. */
export function isMobileNumber(value: string): boolean {
  return /^05[69]\d{7}$/.test(normalizePhone(value))
}

/** "0599 920 307" for showing a number the way people read it. */
export function formatPhone(value: string): string {
  const digits = normalizePhone(value)
  return digits.length === 10
    ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    : value
}
