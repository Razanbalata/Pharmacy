import { http, HttpResponse } from 'msw'
import type { Alert, AlertGroup, AlertKind, AlertSeverity } from '@/entities/alert'
import { ALERT_GROUPS } from '@/entities/alert'
import { daysUntil } from '@/shared/lib/date'
import { roundMoney } from '@/shared/lib/money'
import { apiUrl } from '../api-url'
import { db } from '../db'
import { users } from '../fixtures'
import { quantityOf, statusOf } from './catalog'
import { customerView } from './customers'

/** Expiring "soon" for the red line: a month. The settings' wider window feeds the rest. */
const SOON_DAYS = 30

function today(): Date {
  return new Date(`${db.today}T12:00:00`)
}

function nearestBatch(productId: number) {
  const product = db.products.find((item) => item.id === productId)
  return product?.batches
    .filter((batch) => batch.quantity > 0)
    .sort((a, b) => a.expiry.localeCompare(b.expiry))[0]
}

/**
 * The alerts as they stand now, worked out from the data each time: fixing the problem
 * (writing off, receiving, being paid) makes its alert go away by itself.
 */
export function currentAlerts(): Alert[] {
  const alerts: Alert[] = []
  const at = `${db.today}T06:00:00Z`
  const add = (
    id: string,
    group: AlertGroup,
    severity: AlertSeverity,
    count: number,
    body: AlertKind,
    when = at,
  ) => alerts.push({ ...body, id, group, severity, count, at: when, read: false } as Alert)

  const active = db.products.filter((product) => product.active)

  // Expiry: what is already expired, the nearest to expire, and the rest of the window.
  const expired = active.flatMap((product) =>
    product.batches
      .filter((batch) => batch.quantity > 0 && batch.expiry < db.today)
      .map((batch) => ({ product, batch })),
  )
  if (expired.length > 0) {
    add('expiredInStock', 'expiry', 'danger', expired.length, {
      kind: 'expiredInStock',
      params: {
        batches: expired.length,
        names: expired
          .map(({ product, batch }) => `${product.name} · ${batch.quantity}`)
          .join('، '),
      },
    })
  }
  const expiring = active
    .filter((product) => statusOf(product) === 'soon')
    .map((product) => ({ product, batch: nearestBatch(product.id)! }))
    .sort((a, b) => a.batch.expiry.localeCompare(b.batch.expiry))
  const [first, ...rest] = expiring
  if (first) {
    const days = daysUntil(first.batch.expiry, today())
    add(`expiring:${first.product.id}`, 'expiry', days <= SOON_DAYS ? 'warning' : 'info', 1, {
      kind: 'expiringSoon',
      params: {
        productId: first.product.id,
        name: first.product.name,
        days,
        batch: first.batch.code,
        quantity: first.batch.quantity,
      },
    })
  }
  if (rest.length > 0) {
    add(
      'expiringMore',
      'expiry',
      'warning',
      rest.length,
      {
        kind: 'expiringMore',
        params: {
          count: rest.length,
          value: roundMoney(
            expiring.reduce((sum, { batch }) => sum + batch.quantity * batch.cost, 0),
          ),
        },
      },
      `${new Date(Date.parse(at) - 86_400_000).toISOString()}`,
    )
  }

  // Shortage: the most urgent one by name, then how many more.
  const short = active
    .filter((product) => quantityOf(product) <= product.minStock)
    .sort((a, b) => quantityOf(a) / a.minStock - quantityOf(b) / b.minStock)
  const inStock = short.filter((product) => quantityOf(product) > 0)
  const urgent = inStock[0] ?? short[0]
  if (urgent) {
    const draft = db.orders.find(
      (order) =>
        order.status === 'draft' && order.lines.some((line) => line.productId === urgent.id),
    )
    add(`low:${urgent.id}`, 'shortage', 'danger', 1, {
      kind: 'lowUrgent',
      params: {
        productId: urgent.id,
        name: urgent.name,
        quantity: quantityOf(urgent),
        minStock: urgent.minStock,
        draft: draft ? { id: draft.id, number: draft.number } : null,
      },
    })
    if (short.length > 1) {
      add('lowMore', 'shortage', 'warning', short.length - 1, {
        kind: 'lowMore',
        params: { count: short.length - 1 },
      })
    }
  }

  // Debts: over the limit first, then late.
  for (const customer of db.customers.map(customerView)) {
    if (customer.creditAllowed && customer.debt > customer.debtLimit) {
      add(`debtOverLimit:${customer.id}`, 'debts', 'danger', 1, {
        kind: 'debtOverLimit',
        params: {
          customerId: customer.id,
          name: customer.name,
          debt: customer.debt,
          limit: customer.debtLimit,
          days: customer.debtDays,
        },
      })
    } else if (customer.debtAge === 'late') {
      add(`debtLate:${customer.id}`, 'debts', 'warning', 1, {
        kind: 'debtLate',
        params: {
          customerId: customer.id,
          name: customer.name,
          debt: customer.debt,
          days: customer.debtDays,
        },
      })
    }
  }

  // Purchases waiting to be received.
  for (const order of db.orders) {
    const supplier = db.suppliers.find((item) => item.id === order.supplierId)?.name ?? ''
    if (order.status === 'sent') {
      add(
        `orderSent:${order.id}`,
        'purchases',
        'info',
        1,
        {
          kind: 'orderSent',
          params: { orderId: order.id, number: order.number, supplier, items: order.lines.length },
        },
        order.sentAt ?? order.createdAt,
      )
    } else if (order.status === 'partial') {
      add(
        `orderPartial:${order.id}`,
        'purchases',
        'info',
        1,
        { kind: 'orderPartial', params: { orderId: order.id, number: order.number, supplier } },
        order.sentAt ?? order.createdAt,
      )
    }
  }

  // The plan.
  const pharmacy = users.manager.pharmacy
  if (pharmacy.plan === 'trial') {
    // The plan runs on the real calendar, like the days-left line in the sidebar.
    const days = daysUntil(pharmacy.planEndsAt)
    if (days <= 30) {
      add('trialEnding', 'system', 'neutral', 1, { kind: 'trialEnding', params: { days } })
    }
  }

  const read = new Set(db.alertsRead)
  return alerts.map((alert) => ({ ...alert, read: read.has(alert.id) }))
}

export const alertHandlers = [
  http.get(apiUrl('/api/alerts/summary'), () =>
    HttpResponse.json({
      data: { unread: currentAlerts().filter((alert) => !alert.read).length },
    }),
  ),

  http.get(apiUrl('/api/alerts'), () => {
    const alerts = currentAlerts()
    const counts = Object.fromEntries(
      ALERT_GROUPS.map((group) => [
        group,
        alerts
          .filter((alert) => alert.group === group)
          .reduce((sum, alert) => sum + alert.count, 0),
      ]),
    ) as Record<AlertGroup, number>
    return HttpResponse.json({
      data: alerts,
      summary: {
        unread: alerts.filter((alert) => !alert.read).length,
        counts: { ...counts, all: Object.values(counts).reduce((sum, value) => sum + value, 0) },
        expiryAlertDays: db.settings.stock.expiryAlertDays,
      },
    })
  }),

  http.post(apiUrl('/api/alerts/read-all'), () => {
    db.alertsRead = [...new Set([...db.alertsRead, ...currentAlerts().map((alert) => alert.id)])]
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(apiUrl('/api/alerts/:id/read'), ({ params }) => {
    const id = decodeURIComponent(String(params.id))
    if (!db.alertsRead.includes(id)) db.alertsRead.push(id)
    return new HttpResponse(null, { status: 204 })
  }),
]
