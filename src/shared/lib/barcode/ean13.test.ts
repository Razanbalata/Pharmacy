import { describe, expect, it } from 'vitest'
import { ean13CheckDigit, ean13Modules, internalEan13, isEan13 } from './ean13'

describe('EAN-13', () => {
  it('works out the check digit', () => {
    expect(ean13CheckDigit('400638133393')).toBe(1)
    expect(isEan13('4006381333931')).toBe(true)
    expect(isEan13('4006381333932')).toBe(false)
  })

  it('makes 95 modules with guards at both ends and the middle', () => {
    const modules = ean13Modules('4006381333931')
    expect(modules).toHaveLength(95)
    expect(modules.slice(0, 3)).toEqual([true, false, true])
    expect(modules.slice(45, 50)).toEqual([false, true, false, true, false])
    expect(modules.slice(-3)).toEqual([true, false, true])
  })

  it('gives internal codes in the shop range with a valid check digit', () => {
    const code = internalEan13(6)
    expect(code).toMatch(/^2\d{12}$/)
    expect(isEan13(code)).toBe(true)
  })
})
