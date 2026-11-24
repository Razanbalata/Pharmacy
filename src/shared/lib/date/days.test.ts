import { describe, expect, it } from 'vitest'
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
