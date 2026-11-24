import type { CustomerOption } from '@/entities/customer'
import type { HeldSale, InvoiceLine, InvoicePayment, InvoiceStatus } from '@/entities/invoice'
import type { RefundMethod } from '@/entities/sale-return'
import type { StoredProduct } from './catalog-data'

export interface StoredShift {
  id: number
  number: number
  cashierId: number
  cashierName: string
  openedAt: string
  closedAt: string | null
  openingCash: number
  expectedCash: number | null
  countedCash: number | null
  note: string
  status: 'open' | 'closed'
}

export interface StoredInvoice {
  id: number
  number: string
  at: string
  shiftNumber: number
  customerId: number | null
  cashierId: number
  cashier: string
  /** cost is the batch cost per sold unit, kept for profit; never sent to the cashier. */
  lines: (InvoiceLine & { cost: number })[]
  subtotal: number
  discount: number
  total: number
  payment: InvoicePayment
  status: InvoiceStatus
  log: { at: string; text: string }[]
}

export interface StoredReturn {
  id: number
  number: string
  invoiceId: number
  at: string
  shiftNumber: number
  amount: number
  refund: RefundMethod
}

export function initialSales(products: StoredProduct[]) {
  const customers: CustomerOption[] = [
    { id: 1, name: 'أبو أحمد الشوا', phone: '0599123456', debt: 180, debtLimit: 300 },
    { id: 2, name: 'محمود عياد', phone: '0597223344', debt: 95, debtLimit: 500 },
    { id: 3, name: 'أم خالد', phone: '0598111999', debt: 0, debtLimit: 200 },
    { id: 4, name: 'هبة نصار', phone: '0599402219', debt: 0, debtLimit: 300 },
  ]

  const shifts: StoredShift[] = [
    {
      id: 14,
      number: 14,
      cashierId: 3,
      cashierName: 'محمد سالم',
      openedAt: '2026-11-24T06:00:00Z',
      closedAt: null,
      openingCash: 200,
      expectedCash: null,
      countedCash: null,
      note: '',
      status: 'open',
    },
    {
      id: 13,
      number: 13,
      cashierId: 2,
      cashierName: 'سارة يوسف',
      openedAt: '2026-11-23T06:00:00Z',
      closedAt: '2026-11-23T18:05:00Z',
      openingCash: 200,
      expectedCash: 239,
      countedCash: 239,
      note: '',
      status: 'closed',
    },
  ]

  const product = (id: number) => products.find((item) => item.id === id)
  /** A line as it was sold: price from the unit, batch and cost from the first batch. */
  const line = (
    productId: number,
    quantity: number,
    unitIndex = 0,
  ): StoredInvoice['lines'][number] => {
    const item = product(productId)
    const unit = item?.units[unitIndex]
    const batch = item?.batches[0]
    let factor = 1
    for (let index = 1; index <= unitIndex; index += 1) factor *= item?.units[index]?.perParent ?? 1
    const price = unit?.price ?? 0
    return {
      productId,
      name: item?.name ?? '',
      batch: batch?.code ?? '',
      unit: unit?.name ?? '',
      quantity,
      price,
      total: price * quantity,
      returned: 0,
      cost: (batch?.cost ?? 0) / factor,
    }
  }

  const invoice = (
    id: number,
    at: string,
    shiftNumber: number,
    cashierId: number,
    cashier: string,
    lines: StoredInvoice['lines'],
    payment: Partial<InvoicePayment> & Pick<InvoicePayment, 'method'>,
    extra: { customerId?: number; discount?: number } = {},
  ): StoredInvoice => {
    const subtotal = lines.reduce((sum, item) => sum + item.total, 0)
    const discount = extra.discount ?? 0
    const total = subtotal - discount
    const cash = payment.cash ?? (payment.method === 'cash' ? total : 0)
    const received = payment.received ?? cash
    return {
      id,
      number: `INV-${String(id).padStart(6, '0')}`,
      at,
      shiftNumber,
      customerId: extra.customerId ?? null,
      cashierId,
      cashier,
      lines,
      subtotal,
      discount,
      total,
      payment: {
        method: payment.method,
        cash,
        bank: payment.bank ?? (payment.method === 'bank' ? total : 0),
        credit: payment.credit ?? (payment.method === 'credit' ? total : 0),
        received,
        change: Math.max(0, received - cash),
      },
      status: 'completed',
      log: [{ at, text: `أنشأها ${cashier}` }],
    }
  }

  const invoices: StoredInvoice[] = [
    invoice(238, '2026-11-23T09:10:00Z', 13, 2, 'سارة يوسف', [line(9, 1)], { method: 'cash' }),
    invoice(239, '2026-11-23T15:40:00Z', 13, 2, 'سارة يوسف', [line(16, 1)], { method: 'bank' }),
    invoice(240, '2026-11-24T07:15:00Z', 14, 3, 'محمد سالم', [line(21, 2)], { method: 'cash' }),
    invoice(
      241,
      '2026-11-24T12:20:00Z',
      14,
      3,
      'محمد سالم',
      [line(8, 2), line(18, 1), line(17, 1)],
      { method: 'mixed', cash: 60, bank: 43 },
      { customerId: 2 },
    ),
    invoice(242, '2026-11-24T12:50:00Z', 14, 3, 'محمد سالم', [line(19, 2)], { method: 'bank' }),
    invoice(
      243,
      '2026-11-24T13:05:00Z',
      14,
      3,
      'محمد سالم',
      [line(6, 1)],
      { method: 'credit' },
      { customerId: 1 },
    ),
    invoice(244, '2026-11-24T13:30:00Z', 14, 3, 'محمد سالم', [line(20, 1)], { method: 'cash' }),
    invoice(
      245,
      '2026-11-24T13:42:00Z',
      14,
      3,
      'محمد سالم',
      [line(1, 3), line(9, 3, 1), line(5, 1), line(10, 1)],
      { method: 'cash', received: 200 },
      { discount: 5 },
    ),
  ]

  const held: HeldSale[] = [
    {
      id: 2,
      label: 'فاتورة 2',
      at: '2026-11-24T13:50:00Z',
      cashier: 'محمد سالم',
      customer: { id: 3, name: 'أم خالد' },
      discount: 0,
      lines: [
        { productId: 8, unitIndex: 0, quantity: 2, name: 'Glucophage 500mg 50 Tablets' },
        { productId: 17, unitIndex: 0, quantity: 1, name: 'Zyrtec 10mg 20 Tablets' },
      ],
      total: 58,
    },
    {
      id: 3,
      label: 'فاتورة 3',
      at: '2026-11-24T13:37:00Z',
      cashier: 'محمد سالم',
      customer: null,
      discount: 0,
      lines: [{ productId: 5, unitIndex: 0, quantity: 1, name: 'Ventolin Inhaler 100mcg' }],
      total: 24,
    },
  ]

  const returns: StoredReturn[] = []

  return { customers, shifts, invoices, held, returns }
}
