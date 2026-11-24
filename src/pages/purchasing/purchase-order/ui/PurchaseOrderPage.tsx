import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  purchaseQueries,
  type PurchaseOrder,
} from '@/entities/purchase-order'
import { CancelOrderButton } from '@/features/purchase/cancel-order'
import { OrderForm } from '@/features/purchase/edit-order'
import { paths, to } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { Button, buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { PageSkeleton } from '@/shared/ui/skeleton'

/** A sent, received or cancelled order: what was ordered, what came, what was paid. */
function OrderView({ order }: { order: PurchaseOrder }) {
  const { t } = useTranslation()
  const open = order.status === 'sent' || order.status === 'partial'
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="print-area flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-5">
        {order.status === 'sent' && (
          <p className="rounded-md bg-info-soft px-3 py-2 text-small text-info">
            {t('purchases.form.readOnly')}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <caption className="sr-only">{order.number}</caption>
            <thead>
              <tr className="border-b border-border text-small text-ink-muted">
                <th className="px-2 py-2 text-start font-semibold">
                  {t('purchases.receive.columns.product')}
                </th>
                <th className="px-2 py-2 text-end font-semibold">
                  {t('purchases.receive.columns.ordered')}
                </th>
                <th className="px-2 py-2 text-end font-semibold">
                  {t('purchases.receive.columns.received')}
                </th>
                <th className="px-2 py-2 text-end font-semibold">
                  {t('purchases.receive.columns.cost')}
                </th>
                <th className="px-2 py-2 text-end font-semibold">
                  {t('purchases.receive.columns.total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.productId} className="border-b border-border last:border-0">
                  {/* The cell's text is the product name inside the link. */}
                  {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
                  <th scope="row" className="px-2 py-2.5 text-start font-normal">
                    <Link
                      to={to(paths.productDetail, { id: line.productId })}
                      className="font-semibold hover:text-brand-strong hover:underline"
                    >
                      <bdi>{line.name}</bdi>
                    </Link>
                  </th>
                  <td className="tabular px-2 py-2.5 text-end">
                    {line.quantity} {line.unit}
                  </td>
                  <td className="tabular px-2 py-2.5 text-end">{line.received}</td>
                  <td className="tabular px-2 py-2.5 text-end">{formatMoney(line.cost)}</td>
                  <td className="tabular px-2 py-2.5 text-end">
                    {formatMoney(line.quantity * line.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {order.note && <p className="text-small text-ink-muted">{order.note}</p>}
      </section>
      <aside className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-4">
        <dl className="flex flex-col gap-2 text-body">
          {(
            [
              ['orderedValue', order.total],
              ['receivedValue', order.receivedTotal],
              ['paidValue', order.paid],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <dt className="text-ink-muted">{t(`purchases.receive.${key}`)}</dt>
              <dd className="tabular">{formatMoney(value)} ₪</dd>
            </div>
          ))}
        </dl>
        {open && (
          <Link to={to(paths.purchaseReceive, { id: order.id })} className={buttonVariants()}>
            {t(
              order.status === 'sent'
                ? 'purchases.actions.receive'
                : 'purchases.actions.receiveRest',
            )}
          </Link>
        )}
        <Link
          to={to(paths.supplierDetail, { id: order.supplier.id })}
          className={buttonVariants({ variant: 'secondary' })}
        >
          {order.supplier.name}
        </Link>
        <Button variant="secondary" onClick={() => window.print()}>
          {t('purchases.form.print')}
        </Button>
        <CancelOrderButton order={order} />
      </aside>
    </div>
  )
}

/** /purchases/new starts an order; /purchases/:id finishes a draft or shows a sent order. */
export function PurchaseOrderPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const [search] = useSearchParams()
  const id = params.id === undefined ? null : Number(params.id)
  const order = useQuery({
    ...purchaseQueries.detail(id ?? 0),
    enabled: id !== null && Number.isInteger(id),
  })

  if (id !== null && (order.isError || !Number.isInteger(id))) {
    return (
      <EmptyState
        icon="?"
        title={t('purchases.form.notFound')}
        actions={
          <Link to={paths.purchases} className={buttonVariants({ variant: 'secondary' })}>
            {t('purchases.title')}
          </Link>
        }
      />
    )
  }
  if (id !== null && order.isPending) return <PageSkeleton variant="form" />

  const current = order.data
  const supplierParam = Number(search.get('supplier'))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <nav aria-label={t('common.breadcrumb')} className="text-small text-ink-muted">
          <Link to={paths.purchases} className="text-brand-strong hover:underline">
            {t('purchases.title')}
          </Link>
          {' › '}
          {current?.number ?? t('purchases.form.titleNew')}
        </nav>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-display">
            {current
              ? t('purchases.form.title', { number: current.number })
              : t('purchases.form.titleNew')}
          </h1>
          {current && <OrderStatusBadge status={current.status} />}
          {current && current.paymentStatus !== 'none' && (
            <PaymentStatusBadge status={current.paymentStatus} />
          )}
        </div>
        {current && current.status !== 'draft' && (
          <p className="mt-1 text-body text-ink-muted">{current.supplier.name}</p>
        )}
      </div>

      {!current || current.status === 'draft' ? (
        <OrderForm
          key={current?.id ?? 'new'}
          {...(current ? { order: current } : {})}
          initialSupplierId={
            Number.isInteger(supplierParam) && supplierParam > 0 ? supplierParam : null
          }
          onCreated={(created) =>
            void navigate(to(paths.purchaseDetail, { id: created.id }), { replace: true })
          }
          onReceive={(sent) => void navigate(to(paths.purchaseReceive, { id: sent.id }))}
          {...(current ? { extraActions: <CancelOrderButton order={current} /> } : {})}
        />
      ) : (
        <OrderView order={current} />
      )}
    </div>
  )
}
