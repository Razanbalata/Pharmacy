import { describe, expect, it } from 'vitest'
import { isAcceptablePassword, passwordStrength } from './password'
import { formatPhone, isMobileNumber, normalizePhone } from './phone'

describe('phone', () => {
  it('accepts Jawwal and Ooredoo numbers written any way', () => {
    expect(isMobileNumber('0599 920 307')).toBe(true)
    expect(isMobileNumber('٠٥٦٨-١٢٣٤٥٦')).toBe(true)
  })

  it('refuses landlines and short numbers', () => {
    expect(isMobileNumber('082861234')).toBe(false)
    expect(isMobileNumber('059992030')).toBe(false)
  })

  it('normalizes and formats', () => {
    expect(normalizePhone('٠٥٩٩ ٩٢٠ ٣٠٧')).toBe('0599920307')
    expect(formatPhone('0599920307')).toBe('0599 920 307')
  })
})

describe('password', () => {
  it('needs 8 characters and a digit', () => {
    expect(isAcceptablePassword('pharmacy')).toBe(false)
    expect(isAcceptablePassword('pharma26')).toBe(true)
  })

  it('scores stronger passwords higher', () => {
    expect(passwordStrength('abc')).toBe(0)
    expect(passwordStrength('Pharma2026x')).toBe(3)
    expect(passwordStrength('Pharma2026x!')).toBe(4)
  })
})
