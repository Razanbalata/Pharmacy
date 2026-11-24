import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { categoryName, categoryQueries } from '@/entities/category'
import { ingredientQueries } from '@/entities/ingredient'
import {
  ExpiryInfo,
  PRODUCT_SORTS,
  PRODUCT_TABS,
  StockStatusBadge,
  formatQuantity,
  productQueries,
  productsExportUrl,
  type ProductFilters,
  type ProductSort,
  type ProductSummary,
  type ProductTab,
} from '@/entities/product'
import { canManageCatalog, useCurrentUser } from '@/entities/session'
import { supplierQueries } from '@/entities/supplier'
import { BulkEditDrawer } from '@/features/product/bulk-edit'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/field'
import { DataTable, Pagination, type Column } from '@/shared/ui/table'
import { SelectionBar } from './SelectionBar'

const PER_PAGE = [25, 50, 100] as const
const selectClass = 'h-9 rounded-md border border-border-strong bg-surface-100 px-2 text-small'

function numberParam(value: string | null): number | null {
  return value && Number.isFinite(Number(value)) ? Number(value) : null
}

/** The filters live in the address, so back, refresh and a shared link keep them. */
function useProductFilters() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') as ProductTab | null
  const sort = params.get('sort') as ProductSort | null
  const perPage = Number(params.get('perPage'))
  const filters: ProductFilters = {
    tab: tab && PRODUCT_TABS.includes(tab) ? tab : 'all',
    categoryId: numberParam(params.get('category')),
    ingredientId: numberParam(params.get('ingredient')),
    supplierId: numberParam(params.get('supplier')),
    sort: sort && PRODUCT_SORTS.includes(sort) ? sort : 'expiry',
    search: params.get('q') ?? '',
    page: Math.max(1, Number(params.get('page')) || 1),
    perPage: PER_PAGE.includes(perPage as 25) ? perPage : 25,
  }

  function update(patch: Record<string, string | number | null>) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === '') next.delete(key)
          else next.set(key, String(value))
        }
        // Any change other than the page itself starts again from page 1.
        if (!('page' in patch)) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return { filters, update }
}

export function ProductsPage() {
  const { t, i18n } = useTranslation()
  const { filters, update } = useProductFilters()
  const { data: user } = useCurrentUser()
  const canManage = user && 'pharmacy' in user ? canManageCatalog(user.role) : false
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

  const { data: page, isPending } = useQuery(productQueries.list(filters))
  const { data: categories = [] } = useQuery(categoryQueries.list())
  const { data: ingredients = [] } = useQuery(ingredientQueries.list())
  const { data: suppliers = [] } = useQuery(supplierQueries.options())
  const rows = page?.data ?? []
  const filtered =
    filters.tab !== 'all' ||
    filters.categoryId !== null ||
    filters.ingredientId !== null ||
    filters.supplierId !== null ||
    filters.search !== ''

  const columns: Column<ProductSummary>[] = [
    {
      id: 'product',
      header: t('products.columns.product'),
      cell: (product) => (
        <div className={cn('flex flex-col', !product.active && 'opacity-60')}>
          <span className="flex items-center gap-2">
            <Link
              to={to(paths.productDetail, { id: product.id })}
              className="font-semibold hover:text-brand-strong hover:underline"
            >
              <bdi>{product.name}</bdi>
            </Link>
            {product.prescription && <Badge tone="info">{t('products.prescription')}</Badge>}
          </span>
          {product.ingredient && (
            <bdi className="text-caption text-ink-muted">{product.ingredient.name}</bdi>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      header: t('products.columns.category'),
      cell: (product) => (product.category ? categoryName(product.category, i18n.language) : '—'),
    },
    {
      id: 'quantity',
      header: t('products.columns.quantity'),
      numeric: true,
      cell: (product) => formatQuantity(product.quantity, product.unit),
    },
    {
      id: 'expiry',
      header: t('products.columns.expiry'),
      cell: (product) => <ExpiryInfo date={product.nearestExpiry} />,
    },
    {
      id: 'price',
      header: t('products.columns.price'),
      numeric: true,
      cell: (product) => `${formatMoney(product.price)} ₪`,
    },
    {
      id: 'status',
      header: t('products.columns.status'),
      cell: (product) => <StockStatusBadge status={product.status} active={product.active} />,
    },
    ...(canManage
      ? [
          {
            id: 'actions',
            header: <span className="sr-only">{t('products.columns.actions')}</span>,
            cell: (product: ProductSummary) => (
              <Link
                to={to(paths.productEdit, { id: product.id })}
                aria-label={`${t('products.edit')} ${product.name}`}
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                {t('products.edit')}
              </Link>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('products.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">
            {t('products.subtitle', { count: page?.counts.all ?? 0 })}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link to={paths.productLabels} className={buttonVariants({ variant: 'secondary' })}>
              {t('products.labelsLink')}
            </Link>
            <a href={productsExportUrl()} className={buttonVariants({ variant: 'secondary' })}>
              {t('products.exportAll')}
            </a>
            <Link to={paths.productImport} className={buttonVariants({ variant: 'secondary' })}>
              {t('products.importLink')}
            </Link>
            <Link to={paths.productNew} className={buttonVariants()}>
              + {t('products.add')}
            </Link>
          </div>
        )}
      </div>

      <fieldset className="flex gap-1 overflow-x-auto border-b border-border">
        <legend className="sr-only">{t('products.columns.status')}</legend>
        {PRODUCT_TABS.map((tab) => {
          const on = filters.tab === tab
          return (
            <button
              key={tab}
              type="button"
              aria-pressed={on}
              onClick={() => update({ tab: tab === 'all' ? null : tab })}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-body whitespace-nowrap',
                on
                  ? 'border-brand font-semibold text-brand-strong'
                  : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              {t(`products.tabs.${tab}`)}{' '}
              <span
                className={cn(
                  'tabular rounded-pill px-2 text-caption',
                  on ? 'bg-brand-soft text-brand-strong' : 'bg-surface-200',
                )}
              >
                {page?.counts[tab] ?? 0}
              </span>
            </button>
          )
        })}
      </fieldset>

      <div className="flex flex-wrap items-center gap-2.5">
        <Input
          type="search"
          value={filters.search}
          onChange={(event) => update({ q: event.target.value })}
          placeholder={t('products.filters.search')}
          aria-label={t('products.filters.search')}
          className="h-9 w-64"
        />
        <select
          aria-label={t('products.filters.category')}
          value={filters.categoryId ?? ''}
          onChange={(event) => update({ category: event.target.value })}
          className={selectClass}
        >
          <option value="">
            {t('products.filters.category')}: {t('products.filters.all')}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {categoryName(category, i18n.language)}
            </option>
          ))}
        </select>
        <select
          aria-label={t('products.filters.ingredient')}
          value={filters.ingredientId ?? ''}
          onChange={(event) => update({ ingredient: event.target.value })}
          className={selectClass}
        >
          <option value="">
            {t('products.filters.ingredient')}: {t('products.filters.all')}
          </option>
          {ingredients.map((ingredient) => (
            <option key={ingredient.id} value={ingredient.id}>
              {ingredient.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t('products.filters.supplier')}
          value={filters.supplierId ?? ''}
          onChange={(event) => update({ supplier: event.target.value })}
          className={selectClass}
        >
          <option value="">
            {t('products.filters.supplier')}: {t('products.filters.all')}
          </option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t('products.filters.sort')}
          value={filters.sort}
          onChange={(event) => update({ sort: event.target.value })}
          className={selectClass}
        >
          {PRODUCT_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {t('products.filters.sort')}: {t(`products.sort.${sort}`)}
            </option>
          ))}
        </select>
      </div>

      {canManage && selected.size > 0 && (
        <SelectionBar
          ids={[...selected].map(Number)}
          onClear={() => setSelected(new Set())}
          onBulkEdit={() => setBulkOpen(true)}
        />
      )}

      <DataTable
        caption={t('products.title')}
        columns={columns}
        rows={rows}
        getRowId={(product) => String(product.id)}
        loading={isPending}
        {...(canManage
          ? {
              selection: {
                selected,
                onChange: setSelected,
                rowLabel: (id: string) => rows.find((row) => String(row.id) === id)?.name ?? id,
              },
            }
          : {})}
        empty={
          filtered ? (
            <EmptyState title={t('products.empty.title')} description={t('products.empty.body')} />
          ) : (
            <EmptyState
              tone="brand"
              icon="+"
              title={t('products.empty.firstTitle')}
              description={t('products.empty.firstBody')}
              {...(canManage
                ? {
                    actions: (
                      <Link to={paths.productNew} className={buttonVariants()}>
                        {t('products.add')}
                      </Link>
                    ),
                  }
                : {})}
            />
          )
        }
      />

      {page && page.meta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pagination
            page={page.meta.page}
            pageSize={page.meta.perPage}
            total={page.meta.total}
            onPageChange={(next) => update({ page: next })}
          />
          <label className="flex items-center gap-2 text-small text-ink-muted">
            {t('products.perPage')}
            <select
              value={filters.perPage}
              onChange={(event) => update({ perPage: event.target.value })}
              className={selectClass}
            >
              {PER_PAGE.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {canManage && bulkOpen && (
        <BulkEditDrawer
          open
          ids={[...selected].map(Number)}
          onClose={() => setBulkOpen(false)}
          onDone={() => {
            setBulkOpen(false)
            setSelected(new Set())
          }}
        />
      )}
    </div>
  )
}
