import type { OrderStatus } from '@/entities/purchase-order'
import type { PaymentMethod, SupplierInput } from '@/entities/supplier'

export type StoredSupplier = SupplierInput & { id: number }

export interface StoredOrder {
  id: number
  number: string
  supplierId: number
  status: OrderStatus
  createdAt: string
  sentAt: string | null
  note: string
  lines: { productId: number; quantity: number; cost: number; received: number }[]
  /** Paid against this order. */
  paid: number
}

/** The supplier's account: invoices (what arrived) and payments, in date order. */
export interface LedgerEntry {
  id: number
  supplierId: number
  date: string
  kind: 'invoice' | 'payment'
  reference: string
  orderId: number | null
  detail: string
  method: PaymentMethod | null
  fromDrawer: boolean
  amount: number
}

export function initialPurchases() {
  const suppliers: StoredSupplier[] = [
    {
      id: 1,
      name: 'المستودع الطبي الحديث',
      contactName: 'أبو سامي · مندوب',
      phone: '0599333444',
      address: 'غزة، الشجاعية',
      notes: '',
    },
    {
      id: 2,
      name: 'شركة الشفاء للأدوية',
      contactName: 'خالد · مبيعات',
      phone: '0599111222',
      address: 'غزة، الرمال',
      notes: '',
    },
    {
      id: 3,
      name: 'مستودع النور',
      contactName: 'م. هالة',
      phone: '0598222111',
      address: 'خان يونس',
      notes: '',
    },
    {
      id: 4,
      name: 'شركة القدس للأدوية',
      contactName: 'مكتب غزة',
      phone: '082845566',
      address: 'غزة، تل الهوا',
      notes: 'الدفع تحويل بنكي بس',
    },
  ]

  const line = (productId: number, quantity: number, cost: number, received = 0) => ({
    productId,
    quantity,
    cost,
    received,
  })

  const orders: StoredOrder[] = [
    {
      id: 15,
      number: 'PO-0015',
      supplierId: 2,
      status: 'draft',
      createdAt: '2026-11-24T08:10:00Z',
      sentAt: null,
      note: '',
      paid: 0,
      lines: [line(5, 20, 18), line(6, 10, 95), line(3, 20, 15)],
    },
    {
      id: 14,
      number: 'PO-0014',
      supplierId: 1,
      status: 'sent',
      createdAt: '2026-11-21T09:00:00Z',
      sentAt: '2026-11-21T09:05:00Z',
      note: '',
      paid: 0,
      lines: [
        line(8, 40, 10),
        line(21, 30, 9),
        line(18, 20, 30),
        line(10, 10, 18),
        line(19, 20, 9),
      ],
    },
    {
      id: 13,
      number: 'PO-0013',
      supplierId: 3,
      status: 'partial',
      createdAt: '2026-11-19T10:00:00Z',
      sentAt: '2026-11-19T10:02:00Z',
      note: '',
      paid: 100,
      lines: [line(16, 20, 11, 20), line(20, 30, 8, 10), line(22, 20, 12, 20), line(2, 10, 9, 0)],
    },
    {
      id: 12,
      number: 'PO-0012',
      supplierId: 2,
      status: 'received',
      createdAt: '2026-11-17T12:00:00Z',
      sentAt: '2026-11-17T12:01:00Z',
      note: '',
      paid: 500,
      lines: [line(1, 20, 28, 20), line(9, 25, 14.4, 25)],
    },
    {
      id: 11,
      number: 'PO-0011',
      supplierId: 4,
      status: 'received',
      createdAt: '2026-11-12T09:00:00Z',
      sentAt: '2026-11-12T09:00:00Z',
      note: '',
      paid: 1300,
      lines: [line(12, 20, 37, 20), line(17, 30, 18.67, 30)],
    },
    {
      id: 10,
      number: 'PO-0010',
      supplierId: 1,
      status: 'cancelled',
      createdAt: '2026-11-08T11:00:00Z',
      sentAt: '2026-11-08T11:00:00Z',
      note: '',
      paid: 0,
      lines: [line(4, 5, 22), line(19, 20, 10)],
    },
  ]

  let entry = 0
  const ledger = (
    supplierId: number,
    date: string,
    kind: LedgerEntry['kind'],
    reference: string,
    amount: number,
    detail: string,
    extra: Partial<LedgerEntry> = {},
  ): LedgerEntry => {
    entry += 1
    return {
      id: entry,
      supplierId,
      date,
      kind,
      reference,
      orderId: null,
      detail,
      method: null,
      fromDrawer: false,
      amount,
      ...extra,
    }
  }

  const ledgerEntries: LedgerEntry[] = [
    ledger(1, '2026-10-20', 'invoice', 'PO-0007', 650, 'فاتورة المورد MM-1180 · 4 أصناف'),
    ledger(3, '2026-10-02', 'invoice', 'PO-0005', 120, 'فاتورة المورد N-332 · صنفين'),
    ledger(2, '2026-11-05', 'invoice', 'PO-0009', 700, 'فاتورة المورد SH-4410 · 6 أصناف'),
    ledger(2, '2026-11-10', 'payment', 'RV-0031', 700, 'رزان · من درج الوردية', {
      method: 'cash',
      fromDrawer: true,
    }),
    ledger(4, '2026-11-12', 'invoice', 'PO-0011', 1300, 'فاتورة المورد Q-907 · صنفين', {
      orderId: 11,
    }),
    ledger(4, '2026-11-12', 'payment', 'RV-0032', 1300, 'بنك فلسطين · رزان', { method: 'bank' }),
    ledger(2, '2026-11-18', 'invoice', 'PO-0012', 920, 'فاتورة المورد SH-4527 · صنفين', {
      orderId: 12,
    }),
    ledger(2, '2026-11-18', 'payment', 'RV-0033', 500, 'بنك فلسطين · رزان', {
      method: 'bank',
      orderId: 12,
    }),
    ledger(3, '2026-11-20', 'invoice', 'PO-0013', 540, 'فاتورة المورد N-371 · 3 أصناف', {
      orderId: 13,
    }),
    ledger(3, '2026-11-20', 'payment', 'RV-0034', 100, 'رزان · من درج الوردية', {
      method: 'cash',
      fromDrawer: true,
      orderId: 13,
    }),
  ]

  return { suppliers, orders, ledger: ledgerEntries }
}
