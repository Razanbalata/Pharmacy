import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  INVOICE_PERIODS,
  INVOICE_STATUSES,
  InvoiceStatusBadge,
  PaymentMethodBadge,
  SALE_PAYMENT_METHODS,
  invoiceQueries,
  type InvoiceFilters,
  type InvoicePeriod,
  type InvoiceStatus,
  type InvoiceSummary,
  type SalePaymentMethod,
} from '@/entities/invoice'
import { staffQueries } from '@/entities/staff-member'
import { paths, to } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { DataTable, Pagination, type Column } from '@/shared/ui/table'

const selectClass = 'h-9 rounded-md border border-border-strong bg-surface-100 px-2 text-small'

export function InvoicesPage() {
  const { t, i18n } = useTranslation()
  const [filters, setFilters] = useState<InvoiceFilters>({
    period: 'today',
    cashierId: null,
    method: null,
    status: null,
    search: '',
    page: 1,
  })
  const { data, isPending } = useQuery(invoiceQueries.list(filters))
  const { data: staff = [] } = useQuery(staffQueries.list())
  const update = (patch: Partial<InvoiceFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }))
  const time = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
    ...(filters.period === 'today' || filters.period === 'yesterday'
      ? {}
      : { day: '2-digit', month: '2-digit' }),
  })

  const columns: Column<InvoiceSummary>[] = [
    {
      id: 'number',
      header: t('invoices.columns.number'),
      cell: (invoice) => (
        <Link
          to={to(paths.invoiceDetail, { id: invoice.id })}
          className="tabular font-semibold hover:text-brand-strong hover:underline"
        >
          {invoice.number}
        </Link>
      ),
    },
    {
      id: 'time',
      header: t('invoices.columns.time'),
      cell: (invoice) => <span className="tabular">{time.format(new Date(invoice.at))}</span>,
    },
    {
      id: 'customer',
      header: t('invoices.columns.customer'),
      cell: (invoice) =>
        invoice.customer ?? <span className="text-ink-muted">{t('invoices.walkIn')}</span>,
    },
    { id: 'cashier', header: t('invoices.columns.cashier'), cell: (invoice) => invoice.cashier },
    {
      id: 'lines',
      header: t('invoices.columns.lines'),
      numeric: true,
      cell: (invoice) => invoice.lineCount,
    },
    {
      id: 'method',
      header: t('invoices.columns.method'),
      cell: (invoice) => <PaymentMethodBadge method={invoice.method} />,
    },
    {
      id: 'total',
      header: t('invoices.columns.total'),
      numeric: true,
      cell: (invoice) => `${formatMoney(invoice.total)} ₪`,
    },
    {
      id: 'status',
      header: t('invoices.columns.status'),
      cell: (invoice) => <InvoiceStatusBadge status={invoice.status} />,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('invoices.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('invoices.subtitle')}</p>
        </div>
        <Link to={paths.returns} className={buttonVariants({ variant: 'secondary' })}>
          {t('invoices.newReturn')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented<InvoicePeriod>
          label={t('activity.periodLabel')}
          value={filters.period}
          onChange={(period) => update({ period })}
          options={INVOICE_PERIODS.map((period) => ({
            value: period,
            label: t(`invoices.periods.${period}`),
          }))}
        />
        <Input
          type="search"
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder={t('invoices.search')}
          aria-label={t('invoices.search')}
          className="h-9 w-56"
        />
        <select
          aria-label={t('invoices.cashier')}
          value={filters.cashierId ?? ''}
          onChange={(event) =>
            update({ cashierId: event.target.value ? Number(event.target.value) : null })
          }
          className={selectClass}
        >
          <option value="">
            {t('invoices.cashier')}: {t('invoices.all')}
          </option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t('invoices.method')}
          value={filters.method ?? ''}
          onChange={(event) =>
            update({ method: (event.target.value || null) as SalePaymentMethod | null })
          }
          className={selectClass}
        >
          <option value="">
            {t('invoices.method')}: {t('invoices.all')}
          </option>
          {SALE_PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {t(`payment.methods.${method}`)}
            </option>
          ))}
        </select>
        <select
          aria-label={t('invoices.status')}
          value={filters.status ?? ''}
          onChange={(event) =>
            update({ status: (event.target.value || null) as InvoiceStatus | null })
          }
          className={selectClass}
        >
          <option value="">
            {t('invoices.status')}: {t('invoices.all')}
          </option>
          {INVOICE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`invoices.statuses.${status}`)}
            </option>
          ))}
        </select>
      </div>

      {data && (
        <dl className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-border bg-surface-100 shadow-card px-4 py-3 text-body">
          <div className="flex gap-2">
            <dt className="text-ink-muted">{t('invoices.summaryCount')}</dt>
            <dd className="tabular font-semibold">{data.totals.count}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-muted">{t('invoices.summaryTotal')}</dt>
            <dd className="tabular font-semibold">{formatMoney(data.totals.total)} ₪</dd>
          </div>
          <dd className="tabular text-small text-ink-muted">
            {t('invoices.summarySplit', {
              cash: formatMoney(data.totals.cash),
              bank: formatMoney(data.totals.bank),
              credit: formatMoney(data.totals.credit),
            })}
          </dd>
        </dl>
      )}

      <DataTable
        caption={t('invoices.title')}
        columns={columns}
        rows={data?.data ?? []}
        getRowId={(invoice) => String(invoice.id)}
        loading={isPending}
        empty={<EmptyState title={t('invoices.empty')} />}
      />
      {data && data.meta.total > data.meta.perPage && (
        <Pagination
          page={data.meta.page}
          pageSize={data.meta.perPage}
          total={data.meta.total}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      )}
    </div>
  )
}
