import type { CustomerPaymentMethod } from '@/entities/customer'

export interface StoredCustomer {
  id: number
  name: string
  phone: string
  debtLimit: number
  creditAllowed: boolean
  notes: string
  since: string
}

/**
 * The customer's account. The debt is never stored on its own: it is what these lines add up to,
 * so the list, the statement and the till always agree.
 */
export interface StoredCustomerEntry {
  id: number
  customerId: number
  at: string
  kind: 'opening' | 'sale' | 'payment' | 'return'
  reference: string
  invoiceId: number | null
  method: CustomerPaymentMethod | null
  actor: string
  items: number | null
  debit: number
  credit: number
  /** The shift whose drawer took a cash payment. */
  shiftNumber: number | null
}

export function initialCustomers() {
  const customer = (
    id: number,
    name: string,
    phone: string,
    debtLimit: number,
    since: string,
    notes = '',
    creditAllowed = true,
  ): StoredCustomer => ({ id, name, phone, debtLimit, creditAllowed, notes, since })

  const customers: StoredCustomer[] = [
    customer(
      1,
      'أبو أحمد الشوا',
      '0599123456',
      300,
      '2026-03-10',
      'بيسدد أول كل شهر. ابنه أحمد بيستلم عنه أحياناً.',
    ),
    customer(2, 'محمود عياد', '0597223344', 500, '2025-08-02'),
    customer(3, 'أم خالد', '0598111999', 200, '2026-01-15'),
    customer(4, 'هبة نصار', '0599402219', 300, '2026-06-01'),
    customer(5, 'نادية الحلو', '0597552310', 300, '2025-11-20'),
    customer(6, 'أبو يوسف البطش', '0599870044', 400, '2026-10-09', 'دين قديم من الدفتر.'),
    customer(7, 'سهى عاشور', '0592330981', 300, '2026-02-11'),
    customer(8, 'أبو ماهر نصار', '0599015663', 400, '2026-04-22'),
    customer(9, 'سامي حمدان', '0595702118', 150, '2026-09-30'),
    customer(10, 'أحمد عودة', '0598765432', 0, '2026-11-01', 'بيدفع نقدي دايماً.', false),
  ]

  let next = 0
  const entry = (
    customerId: number,
    at: string,
    kind: StoredCustomerEntry['kind'],
    reference: string,
    amount: number,
    extra: Partial<StoredCustomerEntry> = {},
  ): StoredCustomerEntry => {
    next += 1
    const raises = kind === 'sale' || kind === 'opening'
    return {
      id: next,
      customerId,
      at,
      kind,
      reference,
      invoiceId: null,
      method: null,
      actor: 'محمد',
      items: null,
      debit: raises ? amount : 0,
      credit: raises ? 0 : amount,
      shiftNumber: null,
      ...extra,
    }
  }

  const customerEntries: StoredCustomerEntry[] = [
    entry(1, '2026-11-02T10:00:00Z', 'sale', 'INV-000188', 120, { items: 2 }),
    entry(1, '2026-11-09T09:30:00Z', 'payment', 'R-0041', 60, { method: 'cash', actor: 'سارة' }),
    entry(1, '2026-11-15T16:10:00Z', 'sale', 'INV-000207', 150, { items: 3 }),
    entry(1, '2026-11-21T11:00:00Z', 'payment', 'R-0057', 149, { method: 'bank', actor: 'رزان' }),
    entry(1, '2026-11-24T13:05:00Z', 'sale', 'INV-000243', 119, { items: 1, invoiceId: 243 }),
    entry(2, '2026-11-10T12:00:00Z', 'sale', 'INV-000196', 95, { items: 2 }),
    entry(3, '2026-10-05T15:00:00Z', 'sale', 'INV-000150', 40, { items: 1 }),
    entry(3, '2026-10-20T09:00:00Z', 'payment', 'R-0030', 40, { method: 'cash', actor: 'سارة' }),
    entry(5, '2026-10-14T17:20:00Z', 'sale', 'INV-000160', 200, { items: 4 }),
    entry(5, '2026-11-05T18:00:00Z', 'sale', 'INV-000180', 120, { items: 2 }),
    entry(6, '2026-10-09T08:00:00Z', 'opening', '', 210, { actor: 'رزان' }),
    entry(7, '2026-11-03T14:00:00Z', 'sale', 'INV-000177', 306, { items: 5 }),
    entry(7, '2026-11-16T10:00:00Z', 'payment', 'R-0049', 100, { method: 'cash', actor: 'سارة' }),
    entry(8, '2026-11-20T19:00:00Z', 'sale', 'INV-000222', 210, { items: 3 }),
    entry(9, '2026-11-22T13:00:00Z', 'sale', 'INV-000231', 24, { items: 1 }),
  ]

  return { customers, customerEntries }
}
