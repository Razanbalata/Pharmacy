import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  ORDER_STATUSES,
  OrderStatusBadge,
  PAYMENT_STATUSES,
  PaymentStatusBadge,
  purchaseQueries,
  type OrderFilters,
  type OrderPaymentStatus,
  type OrderStatus,
  type OrderSummary,
} from '@/entities/purchase-order'
import { supplierQueries } from '@/entities/supplier'
import { SuggestedOrdersDialog } from '@/features/purchase/suggested-orders'
import { paths, to } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { Button, buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { DataTable, type Column } from '@/shared/ui/table'

const selectClass = 'h-9 rounded-md border border-border-strong bg-surface-100 px-2 text-small'
const DAYS = [30, 90, 365] as const

/** Where each order's main action goes: finish a draft, receive what is awaited, or look. */
function nextStep(order: OrderSummary): {
  to: string
  label: 'continue' | 'receive' | 'receiveRest' | 'open'
} {
  const id = { id: order.id }
  if (order.status === 'draft') return { to: to(paths.purchaseDetail, id), label: 'continue' }
  if (order.status === 'sent') return { to: to(paths.purchaseReceive, id), label: 'receive' }
  if (order.status === 'partial') return { to: to(paths.purchaseReceive, id), label: 'receiveRest' }
  return { to: to(paths.purchaseDetail, id), label: 'open' }
}

export function PurchasesPage() {
  const { t, i18n } = useTranslation()
  const [filters, setFilters] = useState<OrderFilters>({
    supplierId: null,
    status: null,
    payment: null,
    days: 30,
  })
  const [suggesting, setSuggesting] = useState(false)
  const { data: orders = [], isPending } = useQuery(purchaseQueries.list(filters))
  const { data: suppliers = [] } = useQuery(supplierQueries.options())
  const { data: suggestions = [] } = useQuery(purchaseQueries.suggestions())
  const shortCount = suggestions.reduce((sum, group) => sum + group.lines.length, 0)
  const update = (patch: Partial<OrderFilters>) =>
    setFilters((current) => ({ ...current, ...patch }))
  // Read once: the list says "today" for orders made since the page opened.
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })

  const columns: Column<OrderSummary>[] = [
    {
      id: 'number',
      header: t('purchases.columns.number'),
      cell: (order) => (
        <Link
          to={to(paths.purchaseDetail, { id: order.id })}
          className="tabular font-semibold hover:text-brand-strong hover:underline"
        >
          {order.number}
        </Link>
      ),
    },
    {
      id: 'date',
      header: t('purchases.columns.date'),
      cell: (order) =>
        order.createdAt.startsWith(today) ? (
          t('purchases.today')
        ) : (
          <span className="tabular">{date.format(new Date(order.createdAt))}</span>
        ),
    },
    {
      id: 'supplier',
      header: t('purchases.columns.supplier'),
      cell: (order) => order.supplier.name,
    },
    {
      id: 'lines',
      header: t('purchases.columns.lines'),
      numeric: true,
      cell: (order) => order.lineCount,
    },
    {
      id: 'total',
      header: t('purchases.columns.total'),
      numeric: true,
      cell: (order) => `${formatMoney(order.total)} ₪`,
    },
    {
      id: 'status',
      header: t('purchases.columns.status'),
      cell: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      id: 'payment',
      header: t('purchases.columns.payment'),
      cell: (order) => <PaymentStatusBadge status={order.paymentStatus} />,
    },
    {
      id: 'action',
      header: <span className="sr-only">{t('purchases.columns.actions')}</span>,
      cell: (order) => {
        const step = nextStep(order)
        return (
          <Link
            to={step.to}
            aria-label={`${t(`purchases.actions.${step.label}`)} ${order.number}`}
            className={buttonVariants({
              variant: step.label === 'open' ? 'ghost' : 'secondary',
              size: 'sm',
            })}
          >
            {t(`purchases.actions.${step.label}`)}
          </Link>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('purchases.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('purchases.subtitle')}</p>
        </div>
        <Link to={paths.purchaseNew} className={buttonVariants()}>
          + {t('purchases.add')}
        </Link>
      </div>

      {shortCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning bg-warning-soft px-4 py-3">
          <p>{t('purchases.suggestions', { count: shortCount })}</p>
          <Button size="sm" variant="secondary" onClick={() => setSuggesting(true)}>
            {t('purchases.review')}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <select
          aria-label={t('purchases.filters.supplier')}
          value={filters.supplierId ?? ''}
          onChange={(event) =>
            update({ supplierId: event.target.value ? Number(event.target.value) : null })
          }
          className={selectClass}
        >
          <option value="">
            {t('purchases.filters.supplier')}: {t('purchases.filters.all')}
          </option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t('purchases.filters.status')}
          value={filters.status ?? ''}
          onChange={(event) =>
            update({ status: (event.target.value || null) as OrderStatus | null })
          }
          className={selectClass}
        >
          <option value="">
            {t('purchases.filters.status')}: {t('purchases.filters.all')}
          </option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`purchases.status.${status}`)}
            </option>
          ))}
        </select>
        <select
          aria-label={t('purchases.filters.payment')}
          value={filters.payment ?? ''}
          onChange={(event) =>
            update({ payment: (event.target.value || null) as OrderPaymentStatus | null })
          }
          className={selectClass}
        >
          <option value="">
            {t('purchases.filters.payment')}: {t('purchases.filters.all')}
          </option>
          {PAYMENT_STATUSES.filter((status) => status !== 'none').map((status) => (
            <option key={status} value={status}>
              {t(`purchases.payment.${status}`)}
            </option>
          ))}
        </select>
        <select
          aria-label={t('purchases.filters.period')}
          value={filters.days}
          onChange={(event) => update({ days: Number(event.target.value) as OrderFilters['days'] })}
          className={selectClass}
        >
          {DAYS.map((days) => (
            <option key={days} value={days}>
              {t(`purchases.filters.days.${days}`)}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        caption={t('purchases.title')}
        columns={columns}
        rows={orders}
        getRowId={(order) => String(order.id)}
        loading={isPending}
        empty={<EmptyState title={t('purchases.empty')} />}
      />

      {suggesting && <SuggestedOrdersDialog open onClose={() => setSuggesting(false)} />}
    </div>
  )
}
