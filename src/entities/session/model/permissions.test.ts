import { describe, expect, it } from 'vitest'
import { AREAS, canAccess } from './permissions'

describe('canAccess', () => {
  it('lets the manager open everything', () => {
    expect(AREAS.every((area) => canAccess('manager', area))).toBe(true)
  })

  it('hides money and admin from the pharmacist', () => {
    expect(canAccess('pharmacist', 'finance')).toBe(false)
    expect(canAccess('pharmacist', 'staff')).toBe(false)
    expect(canAccess('pharmacist', 'settings')).toBe(false)
    expect(canAccess('pharmacist', 'stock')).toBe(true)
  })

  it('keeps the cashier to selling and customers', () => {
    expect(canAccess('cashier', 'sales')).toBe(true)
    expect(canAccess('cashier', 'customers')).toBe(true)
    expect(canAccess('cashier', 'purchases')).toBe(false)
    expect(canAccess('cashier', 'reports')).toBe(false)
  })
})
