import { http, HttpResponse } from 'msw'
import type { DamageInput, DamageRecord } from '@/entities/damage-record'
import type { MovementKind } from '@/entities/product'
import type { CountLine, CountLineInput, CountSummary, StockCount } from '@/entities/stock-count'
import type { MovementEntry } from '@/entities/stock-movement'
import { roundMoney } from '@/shared/lib/money'
import { apiUrl } from '../api-url'
import type { StoredProduct } from '../catalog-data'
import { db } from '../db'
import { mockRole } from '../fixtures'
import type { StoredCount, StoredDamage } from '../stock-data'

const DAY_MS = 86_400_000
const ACTOR = 'رزان'

function invalid(field: string, code: string) {
  return HttpResponse.json(
    { message: 'The given data was invalid.', errors: { [field]: [code] } },
    { status: 422 },
  )
}
const notFound = () => HttpResponse.json({ message: 'Not found.' }, { status: 404 })

function product(id: number): StoredProduct | undefined {
  return db.products.find((item) => item.id === id)
}

function addMovement(
  item: StoredProduct,
  movement: {
    delta: number
    kind: MovementKind
    reference: string | null
    batch: string
    balanceAfter: number
  },
) {
  item.movements.push({
    id: Math.max(0, ...item.movements.map((entry) => entry.id)) + 1,
    at: new Date().toISOString(),
    actor: ACTOR,
    ...movement,
  })
}

function damageView(record: StoredDamage): DamageRecord {
  const item = product(record.productId)
  return {
    id: record.id,
    at: record.at,
    product: { id: record.productId, name: item?.name ?? '', unit: item?.units[0]?.name ?? '' },
    batch: record.batch,
    quantity: record.quantity,
    reason: record.reason,
    note: record.note,
    loss: record.loss,
    actor: record.actor,
  }
}

function expiredInStock() {
  return db.products.flatMap((item) =>
    item.batches
      .filter((batch) => batch.quantity > 0 && batch.expiry < db.today)
      .map((batch) => ({
        productId: item.id,
        name: item.name,
        unit: item.units[0]?.name ?? '',
        batch: batch.code,
        expiry: batch.expiry,
        quantity: batch.quantity,
        cost: batch.cost,
      })),
  )
}

function writeOff(input: DamageInput): StoredDamage | null {
  const item = product(input.productId)
  const batch = item?.batches.find((entry) => entry.code === input.batch)
  if (!item || !batch || input.quantity <= 0 || input.quantity > batch.quantity) return null
  batch.quantity -= input.quantity
  const record: StoredDamage = {
    id: Math.max(0, ...db.damage.map((entry) => entry.id)) + 1,
    at: new Date().toISOString(),
    productId: item.id,
    batch: batch.code,
    quantity: input.quantity,
    reason: input.reason,
    note: input.note,
    loss: roundMoney(input.quantity * batch.cost),
    actor: ACTOR,
  }
  db.damage.unshift(record)
  addMovement(item, {
    delta: -input.quantity,
    kind: 'damage',
    reference: null,
    batch: batch.code,
    balanceAfter: batch.quantity,
  })
  return record
}

function countLines(count: StoredCount): CountLine[] {
  return count.lines.map((line) => {
    const item = product(line.productId)
    const batch = item?.batches.find((entry) => entry.code === line.batch)
    return {
      ...line,
      name: item?.name ?? '',
      unit: item?.units[0]?.name ?? '',
      expected: batch?.quantity ?? 0,
      cost: batch?.cost ?? 0,
    }
  })
}

function countView(count: StoredCount): StockCount {
  const category = db.categories.find((item) => item.id === count.categoryId)
  return {
    id: count.id,
    category: category ?? null,
    status: count.status,
    startedAt: count.startedAt,
    startedBy: count.startedBy,
    approvedAt: count.approvedAt,
    approvedBy: count.approvedBy,
    lines: countLines(count),
  }
}

function countSummary(count: StoredCount): CountSummary {
  const lines = countLines(count)
  const differing = lines.filter((line) => line.actual !== null && line.actual !== line.expected)
  const live = {
    lineCount: lines.length,
    differences: differing.length,
    differenceValue: roundMoney(
      differing.reduce((sum, line) => sum + ((line.actual ?? 0) - line.expected) * line.cost, 0),
    ),
  }
  const result = count.result ?? live
  return {
    id: count.id,
    category: countView(count).category,
    status: count.status,
    startedAt: count.startedAt,
    startedBy: count.startedBy,
    approvedAt: count.approvedAt,
    ...result,
  }
}

export const stockHandlers = [
  http.get(apiUrl('/api/stock/movements'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const actorId = query.get('actor')
    // Movements keep the first name; the real server stores the id.
    const actor = db.staff.find((member) => member.id === Number(actorId))?.name.split(' ')[0]
    const kind = query.get('kind')
    const days = Number(query.get('days') ?? 30)
    const since = Date.parse(`${db.today}T23:59:59Z`) - days * DAY_MS
    const all: MovementEntry[] = db.products.flatMap((item) =>
      item.movements
        .filter((movement) => Date.parse(movement.at) >= since)
        .map((movement) => {
          const order =
            movement.kind === 'purchase'
              ? db.orders.find((entry) => entry.number === movement.reference)
              : undefined
          return {
            id: item.id * 100_000 + movement.id,
            at: movement.at,
            product: { id: item.id, name: item.name, unit: item.units[0]?.name ?? '' },
            batch: movement.batch ?? null,
            kind: movement.kind,
            delta: movement.delta,
            balanceAfter: movement.balanceAfter ?? null,
            reference: movement.reference,
            link: order
              ? { type: 'order' as const, id: order.id }
              : movement.kind === 'damage'
                ? { type: 'damage' as const, id: 0 }
                : null,
            actor: movement.actor,
          }
        }),
    )
    const byPeople = all.filter((entry) => !actor || entry.actor === actor)
    const list = byPeople
      .filter((entry) => !kind || entry.kind === kind)
      .sort((a, b) => b.at.localeCompare(a.at))
    const sum = (entries: MovementEntry[]) =>
      entries.reduce((total, entry) => total + entry.delta, 0)
    return HttpResponse.json({
      data: list,
      totals: {
        in: sum(byPeople.filter((entry) => entry.delta > 0)),
        out: -sum(byPeople.filter((entry) => entry.delta < 0)),
        losses: -sum(
          byPeople.filter(
            (entry) => entry.delta < 0 && (entry.kind === 'damage' || entry.kind === 'count'),
          ),
        ),
      },
    })
  }),

  http.get(apiUrl('/api/stock/damage'), () => {
    const month = db.today.slice(0, 7)
    const previous = new Date(Date.parse(`${month}-01T00:00:00Z`) - DAY_MS)
      .toISOString()
      .slice(0, 7)
    const thisMonth = db.damage.filter((record) => record.at.startsWith(month))
    const counts = new Map<string, number>()
    for (const record of thisMonth) counts.set(record.reason, (counts.get(record.reason) ?? 0) + 1)
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    return HttpResponse.json({
      data: thisMonth.map(damageView),
      summary: {
        lossThisMonth: roundMoney(thisMonth.reduce((sum, record) => sum + record.loss, 0)),
        lossLastMonth: roundMoney(
          db.damage
            .filter((record) => record.at.startsWith(previous))
            .reduce((sum, record) => sum + record.loss, 0),
        ),
        count: thisMonth.length,
        topReason: top ? { reason: top[0], count: top[1] } : null,
        expiredInStock: expiredInStock(),
      },
    })
  }),

  http.post(apiUrl('/api/stock/damage'), async ({ request }) => {
    const input = (await request.json()) as DamageInput
    const record = writeOff(input)
    if (!record) return invalid('quantity', 'tooMuch')
    return HttpResponse.json({ data: damageView(record) }, { status: 201 })
  }),

  http.post(apiUrl('/api/stock/damage/expired'), () => {
    let loss = 0
    let count = 0
    for (const batch of expiredInStock()) {
      const record = writeOff({
        productId: batch.productId,
        batch: batch.batch,
        quantity: batch.quantity,
        reason: 'expired',
        note: '',
      })
      if (record) {
        count += 1
        loss += record.loss
      }
    }
    return HttpResponse.json({ data: { count, loss: roundMoney(loss) } })
  }),

  http.get(apiUrl('/api/stock/counts'), () =>
    HttpResponse.json({
      data: [...db.counts].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map(countSummary),
    }),
  ),

  http.get(apiUrl('/api/stock/counts/:id'), ({ params }) => {
    const count = db.counts.find((item) => item.id === Number(params.id))
    return count ? HttpResponse.json({ data: countView(count) }) : notFound()
  }),

  http.post(apiUrl('/api/stock/counts'), async ({ request }) => {
    if (db.counts.some((item) => item.status === 'open')) {
      return HttpResponse.json({ message: 'A count is already open.' }, { status: 409 })
    }
    const { categoryId } = (await request.json()) as { categoryId: number | null }
    const count: StoredCount = {
      id: Math.max(0, ...db.counts.map((item) => item.id)) + 1,
      categoryId,
      status: 'open',
      startedAt: new Date().toISOString(),
      startedBy: ACTOR,
      approvedAt: null,
      approvedBy: null,
      result: null,
      lines: db.products
        .filter((item) => item.active && (categoryId === null || item.categoryId === categoryId))
        .flatMap((item) =>
          item.batches
            .filter((batch) => batch.quantity > 0)
            .map((batch) => ({
              productId: item.id,
              batch: batch.code,
              actual: null,
              reason: null,
            })),
        ),
    }
    db.counts.push(count)
    return HttpResponse.json({ data: countView(count) }, { status: 201 })
  }),

  http.put(apiUrl('/api/stock/counts/:id/lines'), async ({ params, request }) => {
    const count = db.counts.find((item) => item.id === Number(params.id))
    if (!count) return notFound()
    if (count.status !== 'open') return HttpResponse.json({ message: 'Closed.' }, { status: 409 })
    const { lines } = (await request.json()) as { lines: CountLineInput[] }
    for (const input of lines) {
      const line = count.lines.find(
        (item) => item.productId === input.productId && item.batch === input.batch,
      )
      if (line) {
        line.actual = input.actual
        line.reason = input.reason
      }
    }
    return HttpResponse.json({ data: countView(count) })
  }),

  http.post(apiUrl('/api/stock/counts/:id/approve'), ({ params }) => {
    const count = db.counts.find((item) => item.id === Number(params.id))
    if (!count) return notFound()
    if (mockRole() === 'cashier')
      return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
    if (count.status !== 'open') return HttpResponse.json({ message: 'Closed.' }, { status: 409 })
    const lines = countLines(count)
    const missing = lines.findIndex(
      (line) => line.actual !== null && line.actual !== line.expected && !line.reason,
    )
    if (missing !== -1) return invalid(`lines.${missing}.reason`, 'required')
    const result = countSummary(count)
    for (const line of lines) {
      if (line.actual === null || line.actual === line.expected) continue
      const item = product(line.productId)
      const batch = item?.batches.find((entry) => entry.code === line.batch)
      if (!item || !batch) continue
      const delta = line.actual - batch.quantity
      batch.quantity = line.actual
      addMovement(item, {
        delta,
        kind: 'count',
        reference: `جرد ${db.today.slice(8, 10)}/${db.today.slice(5, 7)}`,
        batch: batch.code,
        balanceAfter: batch.quantity,
      })
    }
    count.status = 'approved'
    count.approvedAt = new Date().toISOString()
    count.approvedBy = ACTOR
    count.result = {
      lineCount: result.lineCount,
      differences: result.differences,
      differenceValue: result.differenceValue,
    }
    return HttpResponse.json({ data: countView(count) })
  }),
]
