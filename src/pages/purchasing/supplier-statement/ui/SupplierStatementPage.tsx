import { SearchX } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useCurrentUser } from '@/entities/session'
import { STATEMENT_PERIODS, supplierQueries, type StatementPeriod } from '@/entities/supplier'
import { SupplierFormDrawer } from '@/features/supplier/manage'
import { SupplierPaymentDrawer } from '@/features/supplier/record-payment'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { formatPhone, whatsappLink } from '@/shared/lib/validation'
import { Button, buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Segmented } from '@/shared/ui/segmented'
import { PageSkeleton } from '@/shared/ui/skeleton'

const th = 'px-4 py-3 text-start text-small font-semibold text-ink-muted whitespace-nowrap'
const td = 'px-4 py-3 align-top'

export function SupplierStatementPage() {
  const { t, i18n } = useTranslation()
  const id = Number(useParams().id)
  const [period, setPeriod] = useState<StatementPeriod>('month')
  const [open, setOpen] = useState<'edit' | 'pay' | null>(null)
  const { data: user } = useCurrentUser()
  const { data, isPending, isError } = useQuery({
    ...supplierQueries.statement(id, period),
    enabled: Number.isInteger(id),
  })
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })

  if (isError || !Number.isInteger(id)) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t('suppliers.statement.notFound')}
        actions={
          <Link to={paths.suppliers} className={buttonVariants({ variant: 'secondary' })}>
            {t('suppliers.statement.back')}
          </Link>
        }
      />
    )
  }
  if (isPending) return <PageSkeleton variant="detail" />

  const { supplier } = data
  const pharmacy = user && 'pharmacy' in user ? user.pharmacy.name : ''
  const contact = [
    supplier.contactName,
    supplier.phone && formatPhone(supplier.phone),
    supplier.address,
  ]
    .filter(Boolean)
    .join(' · ')
  const money = (value: number) => (value ? formatMoney(value) : '')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to={paths.suppliers} className="text-small text-brand-strong hover:underline">
            ← {t('suppliers.statement.back')}
          </Link>
          <h1 className="mt-1 font-display text-display">{supplier.name}</h1>
          {contact && <p className="mt-1 text-body text-ink-muted">{contact}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {supplier.phone && (
            <a
              href={whatsappLink(
                supplier.phone,
                t('suppliers.statement.whatsappText', {
                  pharmacy,
                  supplier: supplier.name,
                  amount: formatMoney(supplier.balance),
                }),
              )}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              {t('suppliers.statement.sendWhatsapp')}
            </a>
          )}
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            {t('suppliers.statement.print')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setOpen('edit')}>
            {t('suppliers.statement.edit')}
          </Button>
          {supplier.balance > 0 && (
            <Button size="sm" onClick={() => setOpen('pay')}>
              {t('suppliers.statement.pay')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-warning bg-warning-soft p-4">
          <p className="text-small text-warning">{t('suppliers.statement.owedNow')}</p>
          <p className="tabular mt-1 font-display text-title">{formatMoney(supplier.balance)} ₪</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
          <p className="text-small text-ink-muted">{t('suppliers.statement.purchases')}</p>
          <p className="tabular mt-1 font-display text-title">{formatMoney(data.purchases)} ₪</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
          <p className="text-small text-ink-muted">{t('suppliers.statement.paid')}</p>
          <p className="tabular mt-1 font-display text-title">{formatMoney(data.paid)} ₪</p>
        </div>
        {data.draft && (
          <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
            <p className="text-small text-ink-muted">{t('suppliers.statement.draft')}</p>
            <Link
              to={to(paths.purchaseDetail, { id: data.draft.id })}
              className="tabular mt-1 block font-display text-title text-brand-strong hover:underline"
            >
              {data.draft.number}
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-small text-ink-muted">{t('suppliers.statement.period')}</span>
        <Segmented<StatementPeriod>
          label={t('suppliers.statement.period')}
          value={period}
          onChange={setPeriod}
          options={STATEMENT_PERIODS.map((value) => ({
            value,
            label: t(`suppliers.statement.periods.${value}`),
          }))}
        />
      </div>

      <div className="print-area overflow-x-auto rounded-lg border border-border bg-surface-100 shadow-card">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">{supplier.name}</caption>
          <thead>
            <tr className="border-b border-border">
              <th className={th}>{t('suppliers.statement.columns.date')}</th>
              <th className={th}>{t('suppliers.statement.columns.what')}</th>
              <th className={`${th} text-end`}>{t('suppliers.statement.columns.debit')}</th>
              <th className={`${th} text-end`}>{t('suppliers.statement.columns.credit')}</th>
              <th className={`${th} text-end`}>{t('suppliers.statement.columns.balance')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border bg-surface-200/60">
              <td className={`${td} tabular`}>{date.format(new Date(data.from))}</td>
              <td className={td} colSpan={3}>
                {t('suppliers.statement.opening')}
              </td>
              <td className={`${td} tabular text-end font-semibold`}>
                {formatMoney(data.openingBalance)}
              </td>
            </tr>
            {data.lines.map((line) => (
              <tr key={line.id} className="border-b border-border last:border-0">
                <td className={`${td} tabular`}>{date.format(new Date(line.date))}</td>
                <td className={td}>
                  {line.kind === 'invoice' ? (
                    line.orderId ? (
                      <Link
                        to={to(paths.purchaseDetail, { id: line.orderId })}
                        className="font-semibold text-brand-strong hover:underline"
                      >
                        {t('suppliers.statement.invoice', { number: line.reference })}
                      </Link>
                    ) : (
                      <span className="font-semibold">
                        {t('suppliers.statement.invoice', { number: line.reference })}
                      </span>
                    )
                  ) : (
                    <span className="font-semibold">
                      {t('suppliers.statement.payment', {
                        method: line.method ? t(`suppliers.payment.methods.${line.method}`) : '',
                      })}{' '}
                      <bdi dir="ltr" className="tabular font-normal text-ink-muted">
                        {line.reference}
                      </bdi>
                    </span>
                  )}
                  {line.detail && (
                    <span className="block text-caption text-ink-muted">{line.detail}</span>
                  )}
                </td>
                <td className={`${td} tabular text-end`}>{money(line.debit)}</td>
                <td className={`${td} tabular text-end text-success`}>{money(line.credit)}</td>
                <td className={cn(`${td} tabular text-end font-semibold`)}>
                  {formatMoney(line.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.lines.length === 0 && (
          <p className="p-4 text-center text-small text-ink-muted">
            {t('suppliers.statement.empty')}
          </p>
        )}
      </div>

      {open === 'edit' && (
        <SupplierFormDrawer open supplier={supplier} onClose={() => setOpen(null)} />
      )}
      {open === 'pay' && (
        <SupplierPaymentDrawer open supplier={supplier} onClose={() => setOpen(null)} />
      )}
    </div>
  )
}
