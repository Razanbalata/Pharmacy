/** "2027-09-30" → "09/2027", how expiry is printed on the box. */
export function formatMonthYear(isoDate: string): string {
  const [year, month] = isoDate.split('-')
  return `${month}/${year}`
}

/**
 * Whole months from today to the date: positive ahead, negative behind.
 * Used for "in 10 months" next to an expiry, so it rounds toward today.
 */
export function monthsUntil(isoDate: string, today: Date = new Date()): number {
  const [year = 0, month = 1, day = 1] = isoDate.slice(0, 10).split('-').map(Number)
  let months = (year - today.getFullYear()) * 12 + (month - 1 - today.getMonth())
  if (months > 0 && day < today.getDate()) months -= 1
  if (months < 0 && day > today.getDate()) months += 1
  return months
}
