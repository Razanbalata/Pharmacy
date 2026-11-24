import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('keeps a colour next to a design-system text size', () => {
    expect(cn('text-surface-100', 'text-body')).toBe('text-surface-100 text-body')
  })

  it('lets a later size replace an earlier one', () => {
    expect(cn('text-small', 'text-body')).toBe('text-body')
  })

  it('lets a later colour replace an earlier one', () => {
    expect(cn('text-ink', 'text-brand')).toBe('text-brand')
  })
})
