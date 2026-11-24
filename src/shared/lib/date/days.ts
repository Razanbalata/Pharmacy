const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days from today until an ISO date (YYYY-MM-DD). Past dates give a negative number. */
export function daysUntil(isoDate: string, today: Date = new Date()): number {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  const target = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target - start) / DAY_MS)
}
