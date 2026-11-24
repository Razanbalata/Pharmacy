import { describe, expect, it } from 'vitest'
import { matchesSearch, normalizeArabic } from './normalize'

describe('normalizeArabic', () => {
  it('treats every alef form the same', () => {
    expect(normalizeArabic('أموكسيل')).toBe(normalizeArabic('اموكسيل'))
    expect(normalizeArabic('إبر')).toBe('ابر')
    expect(normalizeArabic('آلام')).toBe('الام')
  })

  it('treats taa marbuta as haa and alef maqsura as yaa', () => {
    expect(normalizeArabic('صيدلية')).toBe('صيدليه')
    expect(normalizeArabic('مستشفى')).toBe('مستشفي')
  })

  it('drops diacritics and tatweel', () => {
    expect(normalizeArabic('دَوَاء')).toBe('دواء')
    expect(normalizeArabic('شـــراب')).toBe('شراب')
  })

  it('turns Arabic digits into Latin digits', () => {
    expect(normalizeArabic('٥٠٠ ملغ')).toBe('500 ملغ')
    expect(normalizeArabic('۱۲')).toBe('12')
  })

  it('lower-cases Latin names', () => {
    expect(normalizeArabic('  Panadol   EXTRA ')).toBe('panadol extra')
  })
})

describe('matchesSearch', () => {
  it('finds a product by part of its name without hamza', () => {
    expect(matchesSearch('أوميغا 3', 'اوميغ')).toBe(true)
  })

  it('matches words in any order', () => {
    expect(matchesSearch('Panadol Extra 24 Tablets', 'extra pana')).toBe(true)
  })

  it('fails when one word is missing', () => {
    expect(matchesSearch('Panadol Extra', 'panadol cold')).toBe(false)
  })
})
