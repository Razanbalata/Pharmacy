import { describe, expect, it } from 'vitest'
import { navigationFor } from './navigation'

const keys = (role: Parameters<typeof navigationFor>[0]) =>
  navigationFor(role).flatMap((group) => group.items.map((item) => item.key))

describe('navigationFor', () => {
  it('gives the manager every item', () => {
    expect(keys('manager')).toHaveLength(18)
  })

  it('drops the admin group for the pharmacist', () => {
    const groups = navigationFor('pharmacist').map((group) => group.title)
    expect(groups).not.toContain('admin')
    expect(keys('pharmacist')).not.toContain('shifts')
  })

  it('leaves the cashier selling, customers and products only', () => {
    expect(keys('cashier')).toEqual([
      'dashboard',
      'pos',
      'invoices',
      'returns',
      'customers',
      'products',
    ])
  })
})
