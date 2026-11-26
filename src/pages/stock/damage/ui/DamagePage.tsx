import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { damageQueries, type DamageRecord } from '@/entities/damage-record'
import { RecordDamageForm } from '@/features/damage/record-damage'
import { WriteOffExpiredButton } from '@/features/damage/write-off-expired'
import { StockTabs } from '@/widgets/stock-tabs'
import { paths, to } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { EmptyState } from '@/shared/ui/empty-state'
import { DataTable, type Column } from '@/shared/ui/table'

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
      <p className="text-small text-ink-muted">{label}</p>
      <p className="tabular mt-1 font-display text-title">{value}</p>
      {sub && <p className="mt-0.5 text-small text-ink-muted">{sub}</p>}
    </div>
  )
}

export function DamagePage() {
  const { t, i18n } = useTranslation()
  const [params] = useSearchParams()
  const initial = Number(params.get('product'))
  const { data, isPending } = useQuery(damageQueries.list())
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })
  const summary = data?.summary

  const columns: Column<DamageRecord>[] = [
    {
      id: 'date',
      header: t('damage.columns.date'),
      cell: (record) => <span className="tabular">{date.format(new Date(record.at))}</span>,
    },
    {
      id: 'product',
      header: t('damage.columns.product'),
      cell: (record) => (
        <Link
          to={to(paths.productDetail, { id: record.product.id })}
          className="hover:text-brand-strong hover:underline"
        >
          <bdi>{record.product.name}</bdi>
        </Link>
      ),
    },
    {
      id: 'quantity',
      header: t('damage.columns.quantity'),
      numeric: true,
      cell: (record) => `${record.quantity} ${record.product.unit}`,
    },
    {
      id: 'reason',
      header: t('damage.columns.reason'),
      cell: (record) => (
        <span>
          {t(`damage.reasons.${record.reason}`)}
          {record.note && <span className="block text-caption text-ink-muted">{record.note}</span>}
        </span>
      ),
    },
    {
      id: 'loss',
      header: t('damage.columns.loss'),
      numeric: true,
      cell: (record) => `${formatMoney(record.loss)} ₪`,
    },
    { id: 'actor', header: t('damage.columns.actor'), cell: (record) => record.actor },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-display">{t('damage.title')}</h1>
        <p className="mt-1 text-body text-ink-muted">{t('damage.subtitle')}</p>
      </div>
      <StockTabs />

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label={t('damage.lossThisMonth')}
            value={`${formatMoney(summary.lossThisMonth)} ₪`}
            sub={t('damage.lastMonth', { amount: formatMoney(summary.lossLastMonth) })}
          />
          <Stat label={t('damage.records')} value={String(summary.count)} />
          {summary.topReason && (
            <Stat
              label={t('damage.topReason')}
              value={t(`damage.reasons.${summary.topReason.reason}`)}
              sub={t('damage.topOf', { count: summary.topReason.count, total: summary.count })}
            />
          )}
        </div>
      )}

      {summary && summary.expiredInStock.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger bg-danger-soft px-4 py-3">
          <p className="text-body">
            {t('damage.expiredBanner', {
              list: summary.expiredInStock
                .map((batch) => `${batch.name} (${batch.quantity} ${batch.unit})`)
                .join('، '),
            })}
          </p>
          <WriteOffExpiredButton />
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <RecordDamageForm
          initialProductId={Number.isInteger(initial) && initial > 0 ? initial : null}
        />
        <section aria-labelledby="damage-list" className="flex flex-col gap-3">
          <h2 id="damage-list" className="font-display text-title">
            {t('damage.list')}
          </h2>
          <DataTable
            caption={t('damage.list')}
            columns={columns}
            rows={data?.data ?? []}
            getRowId={(record) => String(record.id)}
            loading={isPending}
            empty={<EmptyState title={t('damage.empty')} />}
          />
        </section>
      </div>
    </div>
  )
}
