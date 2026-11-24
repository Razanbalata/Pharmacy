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

/** A business number: a mobile, or a landline with its area code (08 for Gaza, then 7 digits). */
export function isPhoneNumber(value: string): boolean {
  return isMobileNumber(value) || /^0[2489]\d{7}$/.test(normalizePhone(value))
}

/** The link that opens a WhatsApp chat, with an optional message ready to send. */
export function whatsappLink(phone: string, text?: string): string {
  const digits = normalizePhone(phone).replace(/^0/, '')
  const base = `https://wa.me/970${digits}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
