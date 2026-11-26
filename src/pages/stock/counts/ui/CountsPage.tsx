import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { categoryName } from '@/entities/category'
import { canApproveCounts, useCurrentUser } from '@/entities/session'
import { countQueries, type CountSummary, type StockCount } from '@/entities/stock-count'
import { CountSheet } from '@/features/stock-count/conduct-count'
import { StartCountForm } from '@/features/stock-count/start-count'
import { StockTabs } from '@/widgets/stock-tabs'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { buttonVariants } from '@/shared/ui/button'
import { PageSkeleton } from '@/shared/ui/skeleton'

function useScope() {
  const { t, i18n } = useTranslation()
  return (category: StockCount['category']) =>
    category ? categoryName(category, i18n.language) : t('counts.wholePharmacy')
}

function OpenCount({ id }: { id: number }) {
  const { t, i18n } = useTranslation()
  const scope = useScope()
  const { data: user } = useCurrentUser()
  const { data: count, isPending } = useQuery(countQueries.detail(id))
  if (isPending || !count) return <PageSkeleton variant="list" />
  const when = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  }).format(new Date(count.startedAt))

  return (
    <section aria-labelledby="open-count" className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h2 id="open-count" className="font-display text-title">
            {t('counts.titleOpen', { scope: scope(count.category) })}
          </h2>
          <Badge tone="warning">{t('counts.open')}</Badge>
        </div>
        <p className="mt-1 text-small text-ink-muted">
          {t('counts.startedBy', { name: count.startedBy, when })}
        </p>
      </div>
      <CountSheet
        key={count.id}
        count={count}
        canApprove={user && 'pharmacy' in user ? canApproveCounts(user) : false}
      />
    </section>
  )
}

function History({ counts }: { counts: CountSummary[] }) {
  const { t, i18n } = useTranslation()
  const scope = useScope()
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    numberingSystem: 'latn',
  })
  if (counts.length === 0) return null
  return (
    <section aria-labelledby="count-history" className="flex flex-col gap-2">
      <h2 id="count-history" className="font-display text-body-strong">
        {t('counts.history')}
      </h2>
      <ul className="flex flex-col rounded-lg border border-border bg-surface-100 shadow-card">
        {counts.map((count) => (
          <li
            key={count.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0"
          >
            <span className="flex flex-col">
              <span className="font-semibold">
                <span className="tabular">{date.format(new Date(count.startedAt))}</span> ·{' '}
                {count.startedBy}
              </span>
              <span className="text-small text-ink-muted">
                {t('counts.historyLine', {
                  scope: scope(count.category),
                  count: count.lineCount,
                  diffs: count.differences,
                })}
              </span>
            </span>
            <span className="flex items-center gap-3">
              <bdi
                dir="ltr"
                className={cn('tabular font-semibold', count.differenceValue < 0 && 'text-danger')}
              >
                {count.differenceValue < 0 ? '− ' : ''}
                {formatMoney(Math.abs(count.differenceValue))} ₪
              </bdi>
              <Badge tone="success">{t('counts.approved')}</Badge>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CountsPage() {
  const { t } = useTranslation()
  const { data: counts = [], isPending } = useQuery(countQueries.list())
  const open = counts.find((count) => count.status === 'open')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('counts.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('counts.subtitle')}</p>
        </div>
        <Link to={paths.stockDamage} className={buttonVariants({ variant: 'secondary' })}>
          {t('damage.formTitle')}
        </Link>
      </div>
      <StockTabs />

      {isPending ? (
        <PageSkeleton variant="list" />
      ) : open ? (
        <OpenCount id={open.id} />
      ) : (
        <section className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-surface-100 p-5">
          <div>
            <h2 className="font-display text-title">{t('counts.none')}</h2>
            <p className="mt-1 text-small text-ink-muted">{t('counts.noneBody')}</p>
          </div>
          <StartCountForm />
        </section>
      )}

      <History counts={counts.filter((count) => count.status === 'approved')} />
    </div>
  )
}
