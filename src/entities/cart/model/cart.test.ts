import { beforeEach, describe, expect, it } from 'vitest'
import { cartTotals, lineBase, maxQuantity, useCart, type CartLine } from './cart'

const augmentin: Omit<CartLine, 'quantity' | 'unitIndex'> = {
  productId: 1,
  name: 'Augmentin 625mg 14 Tablets',
  ingredient: null,
  prescription: true,
  units: [
    { name: 'علبة', perParent: null, price: 39, enabled: true },
    { name: 'شريط', perParent: 2, price: 20, enabled: true },
  ],
  batch: 'A-2291',
  expiry: '2027-09-30',
  stock: 3,
  minStock: 10,
}

describe('cart', () => {
  beforeEach(() => useCart.getState().clear('فاتورة 1'))

  it('adds a product once and counts up when it is added again, up to the stock', () => {
    const { add } = useCart.getState()
    add(augmentin)
    add(augmentin)
    add(augmentin)
    add(augmentin)
    expect(useCart.getState().lines).toHaveLength(1)
    expect(useCart.getState().lines[0]?.quantity).toBe(3)
  })

  it('sells in strips: the price, stock and base quantity follow the unit', () => {
    useCart.getState().add(augmentin)
    useCart.getState().setUnit(1, 1)
    useCart.getState().setQuantity(1, 3)
    const line = useCart.getState().lines[0]!
    expect(lineBase(line)).toBe(1.5)
    expect(maxQuantity(line)).toBe(6)
    expect(cartTotals([line], 5)).toEqual({ subtotal: 60, discount: 5, total: 55, pieces: 3 })
  })

  it('never discounts more than the sale', () => {
    useCart.getState().add(augmentin)
    expect(cartTotals(useCart.getState().lines, 100).total).toBe(0)
  })
})
