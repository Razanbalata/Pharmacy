import { create } from 'zustand'
import { roundMoney } from '@/shared/lib/money'

export interface CartUnit {
  name: string
  perParent: number | null
  price: number
  enabled: boolean
}

/** A product on the sale being made. Quantities are in the chosen unit. */
export interface CartLine {
  productId: number
  name: string
  ingredient: string | null
  prescription: boolean
  units: CartUnit[]
  unitIndex: number
  quantity: number
  /** The batch the sale will take from first, and its expiry. */
  batch: string
  expiry: string
  /** Sellable stock in the first unit (expired batches left out). */
  stock: number
  minStock: number
}

export interface CartCustomer {
  id: number
  name: string
  phone: string
  debt: number
  debtLimit: number
  creditAllowed: boolean
}

interface CartState {
  label: string
  lines: CartLine[]
  customer: CartCustomer | null
  discount: number
  selected: number | null
  add: (line: Omit<CartLine, 'quantity' | 'unitIndex'>) => void
  setQuantity: (productId: number, quantity: number) => void
  setUnit: (productId: number, unitIndex: number) => void
  remove: (productId: number) => void
  select: (productId: number | null) => void
  setCustomer: (customer: CartCustomer | null) => void
  setDiscount: (discount: number) => void
  /** Empties the sale and gives the next one a new label. */
  clear: (label?: string) => void
  load: (sale: {
    label: string
    lines: CartLine[]
    customer: CartCustomer | null
    discount: number
  }) => void
}

/** How many of the first unit one of `unitIndex` is: a strip of a 2-strip box is 0.5. */
export function unitFactor(units: CartUnit[], unitIndex: number): number {
  let factor = 1
  for (let index = 1; index <= unitIndex; index += 1) factor *= units[index]?.perParent ?? 1
  return factor
}

export function linePrice(line: CartLine): number {
  return roundMoney((line.units[line.unitIndex]?.price ?? 0) * line.quantity)
}

/** The line's quantity in the first unit, which stock is counted in. */
export function lineBase(line: CartLine): number {
  return line.quantity / unitFactor(line.units, line.unitIndex)
}

/** The most of the chosen unit that stock allows. */
export function maxQuantity(line: CartLine): number {
  return Math.floor(line.stock * unitFactor(line.units, line.unitIndex) + 1e-9)
}

export function cartTotals(lines: CartLine[], discount: number) {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + linePrice(line), 0))
  const applied = Math.min(discount, subtotal)
  return {
    subtotal,
    discount: applied,
    total: roundMoney(subtotal - applied),
    pieces: lines.reduce((sum, line) => sum + line.quantity, 0),
  }
}

/** The sale on the till. Lives in memory: a held sale is saved on the server instead. */
export const useCart = create<CartState>((set) => ({
  label: 'فاتورة 1',
  lines: [],
  customer: null,
  discount: 0,
  selected: null,
  add: (line) =>
    set((state) => {
      const existing = state.lines.find((item) => item.productId === line.productId)
      if (existing) {
        return {
          selected: line.productId,
          lines: state.lines.map((item) =>
            item.productId === line.productId
              ? { ...item, quantity: Math.min(item.quantity + 1, Math.max(1, maxQuantity(item))) }
              : item,
          ),
        }
      }
      return {
        selected: line.productId,
        lines: [...state.lines, { ...line, quantity: 1, unitIndex: 0 }],
      }
    }),
  setQuantity: (productId, quantity) =>
    set((state) => ({
      lines: state.lines.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    })),
  setUnit: (productId, unitIndex) =>
    set((state) => ({
      lines: state.lines.map((item) =>
        item.productId === productId ? { ...item, unitIndex, quantity: 1 } : item,
      ),
    })),
  remove: (productId) =>
    set((state) => ({
      lines: state.lines.filter((item) => item.productId !== productId),
      selected: state.selected === productId ? null : state.selected,
    })),
  select: (productId) => set({ selected: productId }),
  setCustomer: (customer) => set({ customer }),
  setDiscount: (discount) => set({ discount: Math.max(0, discount) }),
  clear: (label) =>
    set((state) => ({
      lines: [],
      customer: null,
      discount: 0,
      selected: null,
      label: label ?? state.label,
    })),
  load: (sale) => set({ ...sale, selected: null }),
}))
