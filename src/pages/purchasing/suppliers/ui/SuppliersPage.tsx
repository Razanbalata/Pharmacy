import { Phone, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { supplierQueries, type Supplier } from '@/entities/supplier'
import { SupplierFormDrawer } from '@/features/supplier/manage'
import { SupplierPaymentDrawer } from '@/features/supplier/record-payment'
import { paths, to } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { formatPhone, whatsappLink } from '@/shared/lib/validation'
import { Button, buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { DataTable, type Column } from '@/shared/ui/table'

type Open = { kind: 'add' } | { kind: 'pay'; supplier: Supplier } | null

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
      <p className="text-small text-ink-muted">{label}</p>
      <p className="tabular mt-1 font-display text-title">{value}</p>
    </div>
  )
}

export function SuppliersPage() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState<Open>(null)
  const { data, isPending } = useQuery(supplierQueries.list())
  const suppliers = data?.data ?? []
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })

  const columns: Column<Supplier>[] = [
    {
      id: 'supplier',
      header: t('suppliers.columns.supplier'),
      cell: (supplier) => (
        <span className="flex flex-col">
          <Link
            to={to(paths.supplierDetail, { id: supplier.id })}
            className="font-semibold hover:text-brand-strong hover:underline"
          >
            {supplier.name}
          </Link>
          {supplier.contactName && (
            <span className="text-caption text-ink-muted">{supplier.contactName}</span>
          )}
        </span>
      ),
    },
    {
      id: 'contact',
      header: t('suppliers.columns.contact'),
      cell: (supplier) =>
        supplier.phone ? (
          <span className="flex items-center gap-3">
            <bdi dir="ltr" className="tabular">
              {formatPhone(supplier.phone)}
            </bdi>
            <a
              href={whatsappLink(supplier.phone)}
              target="_blank"
              rel="noreferrer"
              aria-label={t('suppliers.whatsapp', { name: supplier.name })}
              className="text-small text-success hover:underline"
            >
              WhatsApp
            </a>
            <a
              href={`tel:${supplier.phone}`}
              aria-label={t('suppliers.call', { name: supplier.name })}
              className="text-small text-brand-strong hover:underline"
            >
              <Phone className="size-4" />
            </a>
          </span>
        ) : (
          '—'
        ),
    },
    {
      id: 'balance',
      header: t('suppliers.columns.balance'),
      numeric: true,
      cell: (supplier) =>
        supplier.balance > 0 ? (
          <span className="font-semibold text-warning">{formatMoney(supplier.balance)} ₪</span>
        ) : (
          <span className="text-success">{t('suppliers.nothingOwed')}</span>
        ),
    },
    {
      id: 'last',
      header: t('suppliers.columns.lastOrder'),
      cell: (supplier) =>
        supplier.lastOrder ? (
          <Link
            to={to(paths.purchaseDetail, { id: supplier.lastOrder.id })}
            className="tabular hover:text-brand-strong hover:underline"
          >
            <bdi dir="ltr">
              {supplier.lastOrder.number} · {date.format(new Date(supplier.lastOrder.date))}
            </bdi>
          </Link>
        ) : (
          '—'
        ),
    },
    {
      id: 'orders',
      header: t('suppliers.columns.orders'),
      numeric: true,
      cell: (supplier) => supplier.ordersThisYear,
    },
    {
      id: 'actions',
      header: <span className="sr-only">{t('suppliers.columns.actions')}</span>,
      cell: (supplier) => (
        <span className="flex justify-end gap-1">
          {supplier.balance > 0 && (
            <Button
              size="sm"
              variant="secondary"
              aria-label={`${t('suppliers.pay')}: ${supplier.name}`}
              onClick={() => setOpen({ kind: 'pay', supplier })}
            >
              {t('suppliers.pay')}
            </Button>
          )}
          <Link
            to={`${paths.purchaseNew}?supplier=${supplier.id}`}
            aria-label={`${t('suppliers.newOrder')}: ${supplier.name}`}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            {t('suppliers.newOrder')}
          </Link>
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('suppliers.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('suppliers.subtitle')}</p>
        </div>
        <Button onClick={() => setOpen({ kind: 'add' })}>+ {t('suppliers.add')}</Button>
      </div>

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label={t('suppliers.totalOwed')}
            value={`${formatMoney(data.summary.totalOwed)} ₪`}
          />
          <Stat
            label={t('suppliers.thisMonth')}
            value={`${formatMoney(data.summary.purchasesThisMonth)} ₪`}
          />
          <Stat label={t('suppliers.awaiting')} value={String(data.summary.awaitingDelivery)} />
        </div>
      )}

      <DataTable
        caption={t('suppliers.title')}
        columns={columns}
        rows={suppliers}
        getRowId={(supplier) => String(supplier.id)}
        loading={isPending}
        empty={
          <EmptyState
            icon={<Plus className="size-6" />}
            tone="brand"
            title={t('suppliers.empty')}
          />
        }
      />

      {open?.kind === 'add' && <SupplierFormDrawer open onClose={() => setOpen(null)} />}
      {open?.kind === 'pay' && (
        <SupplierPaymentDrawer open supplier={open.supplier} onClose={() => setOpen(null)} />
      )}
    </div>
  )
}
