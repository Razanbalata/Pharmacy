import { describe, expect, it } from 'vitest'
import { formatMonthYear, monthsUntil } from './month'
import { daysUntil } from './days'

describe('daysUntil', () => {
  const today = new Date(2026, 10, 24, 15, 30)

  it('counts whole days ahead, whatever the time of day', () => {
    expect(daysUntil('2026-12-12', today)).toBe(18)
  })

  it('is zero today and negative after', () => {
    expect(daysUntil('2026-11-24', today)).toBe(0)
    expect(daysUntil('2026-11-20', today)).toBe(-4)
  })
})

describe('months', () => {
  const today = new Date(2026, 10, 24)

  it('prints expiry the way the box does', () => {
    expect(formatMonthYear('2027-09-30')).toBe('09/2027')
  })

  it('counts whole months ahead and behind', () => {
    expect(monthsUntil('2027-09-30', today)).toBe(10)
    expect(monthsUntil('2026-12-10', today)).toBe(0)
    expect(monthsUntil('2026-10-15', today)).toBe(-1)
  })
})
