import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  CUSTOMER_FILTERS,
  customerQueries,
  type Customer,
  type CustomerFilter,
} from '@/entities/customer'
import { useCurrentUser } from '@/entities/session'
import { CustomerFormDrawer } from '@/features/customer/manage'
import { CustomerPaymentDrawer } from '@/features/customer/record-payment'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { downloadCsv } from '@/shared/lib/csv'
import { formatMoney } from '@/shared/lib/money'
import { formatPhone, whatsappLink } from '@/shared/lib/validation'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { DataTable, type Column } from '@/shared/ui/table'

type Open = { kind: 'add' } | { kind: 'pay'; customer: Customer } | null

const AGE_TONE = { none: 'neutral', recent: 'neutral', weeks: 'warning', late: 'danger' } as const

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'danger' | undefined
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        tone === 'danger' ? 'border-danger bg-danger-soft' : 'border-border bg-surface-100',
      )}
    >
      <p className={cn('text-small', tone === 'danger' ? 'text-danger' : 'text-ink-muted')}>
        {label}
      </p>
      <p className="tabular mt-1 font-display text-title">{value}</p>
    </div>
  )
}

/** The debt notebook, as a list: who owes, how much of their limit, and for how long. */
export function CustomersPage() {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<CustomerFilter>('all')
  const [search, setSearch] = useState('')
  const deferred = useDeferredValue(search.trim())
  const [open, setOpen] = useState<Open>(null)
  const { data: user } = useCurrentUser()
  const { data, isPending } = useQuery(customerQueries.list(filter, deferred))
  const customers = data?.data ?? []
  const pharmacy = user && 'pharmacy' in user ? user.pharmacy.name : ''
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  const lastPurchase = (iso: string | null) => {
    if (!iso) return '—'
    return iso.slice(0, 10) === today ? t('customers.today') : date.format(new Date(iso))
  }

  const columns: Column<Customer>[] = [
    {
      id: 'customer',
      header: t('customers.columns.customer'),
      cell: (customer) => (
        <span className="flex flex-col">
          <Link
            to={to(paths.customerDetail, { id: customer.id })}
            className="font-semibold hover:text-brand-strong hover:underline"
          >
            {customer.name}
          </Link>
          {customer.phone && (
            <bdi dir="ltr" className="tabular text-start text-caption text-ink-muted">
              {formatPhone(customer.phone)}
            </bdi>
          )}
        </span>
      ),
    },
    {
      id: 'debt',
      header: t('customers.columns.debt'),
      numeric: true,
      cell: (customer) =>
        customer.debt > 0 ? (
          <span
            className={cn(
              'font-semibold',
              customer.debt > customer.debtLimit && customer.creditAllowed && 'text-danger',
            )}
          >
            {formatMoney(customer.debt)} ₪
          </span>
        ) : (
          <span className="text-ink-muted">{t('customers.nothingOwed')}</span>
        ),
    },
    {
      id: 'limit',
      header: t('customers.columns.limit'),
      cell: (customer) => {
        if (!customer.creditAllowed) {
          return <span className="text-small text-ink-muted">{t('customers.noCredit')}</span>
        }
        const over = customer.debt > customer.debtLimit
        const share =
          customer.debtLimit > 0 ? Math.min(100, (customer.debt / customer.debtLimit) * 100) : 100
        return (
          <span className="flex min-w-28 flex-col gap-1">
            <span className="h-1.5 overflow-hidden rounded-pill bg-surface-200" aria-hidden>
              <span
                className={cn(
                  'block h-full rounded-pill',
                  over ? 'bg-danger' : share > 70 ? 'bg-warning' : 'bg-brand',
                )}
                style={{ width: `${share}%` }}
              />
            </span>
            <span className={cn('tabular text-caption', over ? 'text-danger' : 'text-ink-muted')}>
              {over
                ? t('customers.overLimit', { limit: formatMoney(customer.debtLimit) })
                : t('customers.ofLimit', { limit: formatMoney(customer.debtLimit) })}
            </span>
          </span>
        )
      },
    },
    {
      id: 'age',
      header: t('customers.columns.age'),
      cell: (customer) =>
        customer.debtAge === 'none' ? (
          '—'
        ) : (
          <Badge tone={AGE_TONE[customer.debtAge]}>
            {t(`customers.ages.${customer.debtAge}`, { count: customer.debtDays })}
          </Badge>
        ),
    },
    {
      id: 'last',
      header: t('customers.columns.last'),
      cell: (customer) => <span className="tabular">{lastPurchase(customer.lastPurchase)}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">{t('customers.columns.actions')}</span>,
      cell: (customer) =>
        customer.debt > 0 && (
          <span className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${t('customers.pay')}: ${customer.name}`}
              onClick={() => setOpen({ kind: 'pay', customer })}
            >
              {t('customers.pay')}
            </Button>
            {customer.phone && (
              <a
                href={whatsappLink(
                  customer.phone,
                  t('customers.remindText', {
                    name: customer.name,
                    pharmacy,
                    amount: formatMoney(customer.debt),
                  }),
                )}
                target="_blank"
                rel="noreferrer"
                aria-label={`${t('customers.remind')}: ${customer.name}`}
                className="inline-flex h-8 items-center rounded-md px-3 text-small text-success hover:bg-success-soft"
              >
                {t('customers.remind')}
              </a>
            )}
          </span>
        ),
    },
  ]

  function exportList() {
    downloadCsv(t('customers.exportFile'), [
      [
        t('customers.columns.customer'),
        t('customerForm.phone'),
        t('customers.columns.debt'),
        t('customerForm.debtLimit'),
        t('customers.columns.age'),
      ],
      ...customers.map((customer) => [
        customer.name,
        customer.phone,
        customer.debt,
        customer.creditAllowed ? customer.debtLimit : '',
        customer.debtDays || '',
      ]),
    ])
  }

  const summary = data?.summary
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('customers.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('customers.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportList} disabled={customers.length === 0}>
            {t('customers.export')}
          </Button>
          <Button onClick={() => setOpen({ kind: 'add' })}>+ {t('customers.add')}</Button>
        </div>
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label={t('customers.totalDebt')} value={`${formatMoney(summary.totalDebt)} ₪`} />
          <Stat label={t('customers.withDebt')} value={String(summary.withDebt)} />
          <Stat
            label={t('customers.late')}
            tone={summary.late.count > 0 ? 'danger' : undefined}
            value={t('customers.lateValue', {
              count: summary.late.count,
              amount: formatMoney(summary.late.amount),
            })}
          />
          <Stat
            label={t('customers.collected')}
            value={`${formatMoney(summary.collectedThisMonth)} ₪`}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Segmented<CustomerFilter>
          label={t('customers.filterLabel')}
          value={filter}
          onChange={setFilter}
          options={CUSTOMER_FILTERS.map((value) => ({
            value,
            label: summary
              ? `${t(`customers.filters.${value}`)} · ${summary.counts[value]}`
              : t(`customers.filters.${value}`),
          }))}
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('customers.search')}
          aria-label={t('customers.search')}
          className="h-9 w-64"
        />
      </div>

      <DataTable
        caption={t('customers.title')}
        columns={columns}
        rows={customers}
        getRowId={(customer) => String(customer.id)}
        loading={isPending}
        empty={
          <EmptyState
            icon="+"
            tone="brand"
            title={filter === 'all' && !deferred ? t('customers.emptyAll') : t('customers.empty')}
          />
        }
      />

      {open?.kind === 'add' && <CustomerFormDrawer open onClose={() => setOpen(null)} />}
      {open?.kind === 'pay' && (
        <CustomerPaymentDrawer open customer={open.customer} onClose={() => setOpen(null)} />
      )}
    </div>
  )
}
