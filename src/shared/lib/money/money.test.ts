import { describe, expect, it } from 'vitest'
import { formatMoney, roundMoney } from './money'

describe('money', () => {
  it('always shows two decimals with Western digits', () => {
    expect(formatMoney(39)).toBe('39.00')
    expect(formatMoney(1234.5)).toBe('1,234.50')
  })

  it('rounds to agorot', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
    expect(roundMoney(20.475)).toBe(20.48)
  })
})
