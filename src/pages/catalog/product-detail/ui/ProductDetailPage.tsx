import { SearchX } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { categoryName } from '@/entities/category'
import {
  StockStatusBadge,
  formatQuantity,
  productQueries,
  type ProductDetail,
} from '@/entities/product'
import { canManageCatalog, useCurrentUser } from '@/entities/session'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMonthYear } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { PageSkeleton } from '@/shared/ui/skeleton'

function Card({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn('rounded-lg border border-border bg-surface-100 shadow-card p-4', className)}
    >
      <h2 className="mb-3 font-display text-body-strong">{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
      <p className="text-small text-ink-muted">{label}</p>
      <p className="tabular mt-1 font-display text-title">{value}</p>
      {sub && <p className="mt-0.5 text-small text-ink-muted">{sub}</p>}
    </div>
  )
}

function useDateTime() {
  const { i18n } = useTranslation()
  return new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  })
}

function Header({ product, canManage }: { product: ProductDetail; canManage: boolean }) {
  const { t, i18n } = useTranslation()
  const details = [
    product.form ? t(`products.forms.${product.form}`) : null,
    product.strength,
    product.manufacturer,
  ].filter(Boolean)
  const action = buttonVariants({ variant: 'secondary', size: 'sm' })

  return (
    <div className="flex flex-col gap-3">
      <Link to={paths.products} className="text-small text-brand-strong hover:underline">
        ← {t('products.detail.back')}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-display">
            <bdi>{product.name}</bdi>
          </h1>
          {product.ingredient && (
            <bdi className="text-body text-ink-muted">{product.ingredient.name}</bdi>
          )}
          <div className="flex flex-wrap items-center gap-2 text-small">
            <StockStatusBadge status={product.status} active={product.active} />
            {product.category && (
              <Badge tone="brand">{categoryName(product.category, i18n.language)}</Badge>
            )}
            {product.prescription && <Badge tone="info">{t('products.prescription')}</Badge>}
            {details.length > 0 && <span className="text-ink-muted">{details.join(' · ')}</span>}
            <bdi dir="ltr" className="tabular text-ink-muted">
              {product.barcode ?? t('products.detail.noBarcode')}
            </bdi>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.active && (
            <Link
              to={`${paths.pos}?product=${product.id}`}
              className={buttonVariants({ size: 'sm' })}
            >
              {t('products.detail.sell')}
            </Link>
          )}
          {canManage && (
            <>
              <Link to={`${paths.purchases}?ids=${product.id}`} className={action}>
                {t('products.detail.addToPurchase')}
              </Link>
              <Link to={`${paths.stockDamage}?product=${product.id}`} className={action}>
                {t('products.detail.damage')}
              </Link>
              <Link to={`${paths.productLabels}?ids=${product.id}`} className={action}>
                {t('products.detail.printLabel')}
              </Link>
              <Link to={to(paths.productEdit, { id: product.id })} className={action}>
                {t('products.detail.edit')}
              </Link>
            </>
          )}
        </div>
      </div>
      {!product.active && (
        <p className="rounded-md bg-surface-200 px-3 py-2 text-small text-ink-muted">
          {t('products.detail.stopped')}
        </p>
      )}
    </div>
  )
}

function SalesChart({ days }: { days: number[] }) {
  const { t } = useTranslation()
  const max = Math.max(1, ...days)
  const total = days.reduce((sum, day) => sum + day, 0)
  return (
    <figure>
      <figcaption className="sr-only">{`${t('products.detail.salesChart')}: ${total}`}</figcaption>
      <div aria-hidden className="flex h-20 items-end gap-[3px]">
        {days.map((value, index) => (
          <span
            // The days are a fixed list in order; the index is the day.
            // oxlint-disable-next-line react/no-array-index-key
            key={index}
            className={cn('flex-1 rounded-t-sm bg-brand', index < days.length - 3 && 'opacity-55')}
            style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-caption text-ink-muted">
        <span>{t('products.detail.salesStart')}</span>
        <span>{t('products.detail.salesEnd')}</span>
      </div>
    </figure>
  )
}

export function ProductDetailPage() {
  const { t } = useTranslation()
  const dateTime = useDateTime()
  const id = Number(useParams().id)
  const { data: user } = useCurrentUser()
  const canManage = user && 'pharmacy' in user ? canManageCatalog(user.role) : false
  const {
    data: product,
    isPending,
    isError,
  } = useQuery({
    ...productQueries.detail(id),
    enabled: Number.isInteger(id),
  })

  if (isError || !Number.isInteger(id)) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t('products.detail.notFound')}
        actions={
          <Link to={paths.products} className={buttonVariants({ variant: 'secondary' })}>
            {t('products.detail.back')}
          </Link>
        }
      />
    )
  }
  if (isPending) return <PageSkeleton variant="detail" />

  const [first, ...rest] = product.units
  const margin =
    product.averageCost !== null && product.price > 0
      ? Math.round(((product.price - product.averageCost) / product.price) * 100)
      : null

  return (
    <div className="flex flex-col gap-5">
      <Header product={product} canManage={canManage} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={t('products.detail.quantity')}
          value={formatQuantity(product.quantity, product.unit)}
          sub={`${t('products.detail.minStock')}: ${formatQuantity(product.minStock, product.unit)}`}
        />
        <Stat
          label={t('products.detail.price', { unit: product.unit })}
          value={`${formatMoney(product.price)} ₪`}
        />
        <Stat
          label={t('products.detail.cost')}
          value={
            product.averageCost === null ? (
              <span className="text-body text-ink-muted">{t('products.detail.costHidden')}</span>
            ) : (
              <span className="flex items-baseline gap-2">
                {formatMoney(product.averageCost)}
                {margin !== null && <span className="text-body text-success">{margin}%</span>}
              </span>
            )
          }
        />
        <Stat
          label={t('products.detail.sold')}
          value={formatQuantity(product.soldLast30, product.unit)}
          {...(product.supplier
            ? { sub: `${t('products.detail.supplier')}: ${product.supplier.name}` }
            : {})}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card title={t('products.detail.batches')}>
            {product.batches.length === 0 ? (
              <p className="text-small text-ink-muted">{t('products.detail.noBatches')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-body">
                  <caption className="sr-only">{t('products.detail.batches')}</caption>
                  <thead>
                    <tr className="border-b border-border text-start text-small text-ink-muted">
                      <th className="py-2 text-start font-semibold">
                        {t('products.detail.batch')}
                      </th>
                      <th className="py-2 text-start font-semibold">
                        {t('products.detail.expires')}
                      </th>
                      <th className="py-2 text-end font-semibold">
                        {t('products.detail.batchQuantity')}
                      </th>
                      {product.averageCost !== null && (
                        <th className="py-2 text-end font-semibold">
                          {t('products.detail.batchCost')}
                        </th>
                      )}
                      <th className="py-2 text-start font-semibold ps-4">
                        {t('products.detail.batchSupplier')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.batches.map((batch) => (
                      <tr key={batch.code} className="border-b border-border last:border-0">
                        <td className="py-2.5">
                          <bdi dir="ltr" className="tabular">
                            {batch.code}
                          </bdi>
                          {batch.nextToSell && (
                            <Badge tone="success" className="ms-2">
                              {t('products.detail.nextToSell')}
                            </Badge>
                          )}
                        </td>
                        <td className="tabular py-2.5">{formatMonthYear(batch.expiry)}</td>
                        <td className="tabular py-2.5 text-end">
                          {formatQuantity(batch.quantity, product.unit)}
                        </td>
                        {batch.cost !== null && (
                          <td className="tabular py-2.5 text-end">{formatMoney(batch.cost)}</td>
                        )}
                        <td className="py-2.5 ps-4">{batch.supplier ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title={t('products.detail.sales')}>
            <SalesChart days={product.dailySales} />
          </Card>

          <Card title={t('products.detail.movements')}>
            {product.movements.length === 0 ? (
              <p className="text-small text-ink-muted">{t('products.detail.noMovements')}</p>
            ) : (
              <ul className="flex flex-col">
                {product.movements.map((movement) => (
                  <li
                    key={movement.id}
                    className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
                  >
                    <bdi
                      dir="ltr"
                      className={cn(
                        'tabular w-12 font-semibold',
                        movement.delta < 0 ? 'text-danger' : 'text-success',
                      )}
                    >
                      {movement.delta > 0 ? `+${movement.delta}` : `−${-movement.delta}`}
                    </bdi>
                    <span className="grow">
                      {t(`products.detail.movementKinds.${movement.kind}`)}
                      {movement.reference && (
                        <>
                          {' · '}
                          <bdi dir="ltr" className="tabular">
                            {movement.reference}
                          </bdi>
                        </>
                      )}
                      {' · '}
                      {movement.actor}
                    </span>
                    <span className="tabular text-small text-ink-muted">
                      {dateTime.format(new Date(movement.at))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title={t('products.detail.units')}>
            <ul className="flex flex-col gap-2 text-body">
              {first && (
                <li>
                  {first.name} · <span className="tabular">{formatMoney(first.price)} ₪</span>
                </li>
              )}
              {rest.map((unit, index) => {
                const parent = product.units[index]
                return (
                  <li key={unit.name} className={cn(!unit.enabled && 'text-ink-muted')}>
                    {unit.enabled ? (
                      <>
                        {t('products.detail.unitContains', {
                          unit: parent?.name ?? '',
                          count: unit.perParent ?? 1,
                          child: unit.name,
                        })}
                        {' · '}
                        <span className="tabular">{formatMoney(unit.price)} ₪</span>
                      </>
                    ) : (
                      t('products.detail.unitOff', { unit: unit.name })
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card title={t('products.detail.alternatives')}>
            {!product.ingredient ? (
              <p className="text-small text-ink-muted">{t('products.detail.noIngredient')}</p>
            ) : product.alternatives.length === 0 ? (
              <p className="text-small text-ink-muted">{t('products.detail.noAlternatives')}</p>
            ) : (
              <ul className="flex flex-col">
                {product.alternatives.map((alternative) => (
                  <li
                    key={alternative.id}
                    className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
                  >
                    <span className="flex flex-col">
                      <Link
                        to={to(paths.productDetail, { id: alternative.id })}
                        className="font-semibold hover:text-brand-strong hover:underline"
                      >
                        <bdi>{alternative.name}</bdi>
                      </Link>
                      <span className="text-caption text-ink-muted">
                        {t(`products.status.${alternative.status}`)}
                        {alternative.quantity > 0 &&
                          ` · ${formatQuantity(alternative.quantity, alternative.unit)}`}
                      </span>
                    </span>
                    <span className="tabular text-body">{formatMoney(alternative.price)} ₪</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
