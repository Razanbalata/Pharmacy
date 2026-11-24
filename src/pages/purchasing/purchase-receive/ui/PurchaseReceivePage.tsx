import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { purchaseQueries } from '@/entities/purchase-order'
import { ReceiveForm } from '@/features/purchase/receive-order'
import { paths, to } from '@/shared/config'
import { buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { PageSkeleton } from '@/shared/ui/skeleton'

export function PurchaseReceivePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const id = Number(useParams().id)
  const {
    data: order,
    isPending,
    isError,
  } = useQuery({
    ...purchaseQueries.detail(id),
    enabled: Number.isInteger(id),
  })

  if (isError || !Number.isInteger(id)) {
    return <EmptyState icon="?" title={t('purchases.form.notFound')} />
  }
  if (isPending) return <PageSkeleton variant="form" />

  const back = to(paths.purchaseDetail, { id: order.id })
  if (order.status !== 'sent' && order.status !== 'partial') {
    return (
      <EmptyState
        title={t('purchases.receive.notOpen')}
        actions={
          <Link to={back} className={buttonVariants({ variant: 'secondary' })}>
            {order.number}
          </Link>
        }
      />
    )
  }

  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <nav aria-label={t('common.breadcrumb')} className="text-small text-ink-muted">
          <Link to={paths.purchases} className="text-brand-strong hover:underline">
            {t('purchases.title')}
          </Link>
          {' › '}
          <Link to={back} className="text-brand-strong hover:underline">
            {order.number}
          </Link>
          {' › '}
          {t('purchases.actions.receive')}
        </nav>
        <h1 className="mt-1 font-display text-display">
          {t('purchases.receive.title', { number: order.number })}
        </h1>
        <p className="mt-1 text-body text-ink-muted">
          {t('purchases.receive.subtitle', {
            supplier: order.supplier.name,
            date: date.format(new Date(order.sentAt ?? order.createdAt)),
            count: order.lines.length,
          })}
        </p>
      </div>
      <ReceiveForm order={order} onDone={() => void navigate(back)} />
    </div>
  )
}
