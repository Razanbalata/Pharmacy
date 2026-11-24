import type { DamageReason } from '@/entities/damage-record'
import type { CountReason } from '@/entities/stock-count'
import type { StoredProduct } from './catalog-data'

export interface StoredDamage {
  id: number
  at: string
  productId: number
  batch: string
  quantity: number
  reason: DamageReason
  note: string
  loss: number
  actor: string
}

export interface StoredCount {
  id: number
  categoryId: number | null
  status: 'open' | 'approved'
  startedAt: string
  startedBy: string
  approvedAt: string | null
  approvedBy: string | null
  /** Only what was typed; the expected quantity is read from the batch each time. */
  lines: { productId: number; batch: string; actual: number | null; reason: CountReason | null }[]
  /** Filled when approved, so the history keeps its numbers. */
  result: { lineCount: number; differences: number; differenceValue: number } | null
}

/** Damage and counts from the design, and the movements they left on the products. */
export function initialStock(products: StoredProduct[]) {
  const damage: StoredDamage[] = [
    {
      id: 8,
      at: '2026-11-23T09:30:00Z',
      productId: 18,
      batch: 'VD-0612',
      quantity: 1,
      reason: 'customerReturn',
      note: 'العلبة مفتوحة',
      loss: 30,
      actor: 'سارة',
    },
    {
      id: 7,
      at: '2026-11-20T07:40:00Z',
      productId: 22,
      batch: 'ST-0322',
      quantity: 2,
      reason: 'expired',
      note: '',
      loss: 24,
      actor: 'رزان',
    },
    {
      id: 6,
      at: '2026-11-17T12:15:00Z',
      productId: 17,
      batch: 'ZY-1130',
      quantity: 1,
      reason: 'broken',
      note: 'وقعت عن الرف',
      loss: 18,
      actor: 'محمد',
    },
    {
      id: 5,
      at: '2026-11-12T10:00:00Z',
      productId: 19,
      batch: 'BR-0807',
      quantity: 3,
      reason: 'expired',
      note: '',
      loss: 27,
      actor: 'سارة',
    },
    {
      id: 4,
      at: '2026-11-08T08:20:00Z',
      productId: 21,
      batch: 'PN-0420',
      quantity: 4,
      reason: 'expired',
      note: '',
      loss: 36,
      actor: 'رزان',
    },
    {
      id: 3,
      at: '2026-11-03T15:05:00Z',
      productId: 16,
      batch: 'OM-0110',
      quantity: 3,
      reason: 'storage',
      note: 'برا الثلاجة',
      loss: 33,
      actor: 'سارة',
    },
    {
      id: 2,
      at: '2026-10-25T11:00:00Z',
      productId: 6,
      batch: 'NR-0702',
      quantity: 3,
      reason: 'storage',
      note: '',
      loss: 270,
      actor: 'رزان',
    },
    {
      id: 1,
      at: '2026-10-09T09:00:00Z',
      productId: 4,
      batch: 'AS-0301',
      quantity: 4,
      reason: 'expired',
      note: '',
      loss: 88,
      actor: 'سارة',
    },
  ]

  // The log page needs recent movements of every kind, not only the opening stock.
  const extra: Record<number, StoredProduct['movements']> = {
    9: [
      {
        id: 901,
        at: '2026-11-24T13:42:00Z',
        delta: -3,
        kind: 'sale',
        reference: 'INV-000245',
        actor: 'محمد',
        batch: 'P-1180',
        balanceAfter: 117,
      },
    ],
    17: [
      {
        id: 1701,
        at: '2026-11-23T15:05:00Z',
        delta: 1,
        kind: 'return',
        reference: 'RT-0012',
        actor: 'سارة',
        batch: 'ZY-1130',
        balanceAfter: 4,
      },
    ],
  }
  for (const record of damage) {
    const list = (extra[record.productId] ??= [])
    list.push({
      id: record.productId * 1000 + record.id,
      at: record.at,
      delta: -record.quantity,
      kind: 'damage',
      reference: null,
      actor: record.actor,
      batch: record.batch,
      balanceAfter: null,
    })
  }
  for (const product of products) {
    product.movements.push(...(extra[product.id] ?? []))
  }

  const batchOf = (productId: number, index = 0) =>
    products.find((item) => item.id === productId)?.batches[index]?.code ?? ''

  const counts: StoredCount[] = [
    {
      id: 2,
      categoryId: 1,
      status: 'open',
      startedAt: '2026-11-24T07:10:00Z',
      startedBy: 'سارة',
      approvedAt: null,
      approvedBy: null,
      result: null,
      lines: [
        { productId: 1, batch: 'A-2291', actual: 29, reason: 'unknown' },
        { productId: 1, batch: 'A-2410', actual: 8, reason: null },
        { productId: 3, batch: batchOf(3), actual: 11, reason: 'unrecordedDamage' },
        { productId: 4, batch: batchOf(4), actual: null, reason: null },
        { productId: 11, batch: batchOf(11), actual: 9, reason: null },
        { productId: 12, batch: batchOf(12), actual: 16, reason: 'entryError' },
      ],
    },
    {
      id: 1,
      categoryId: null,
      status: 'approved',
      startedAt: '2026-11-15T17:00:00Z',
      startedBy: 'رزان',
      approvedAt: '2026-11-15T18:30:00Z',
      approvedBy: 'رزان',
      lines: [],
      result: { lineCount: 31, differences: 2, differenceValue: -55 },
    },
  ]

  return { damage, counts }
}
