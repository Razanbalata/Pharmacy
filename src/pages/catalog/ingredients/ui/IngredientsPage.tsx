import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { ingredientQueries, type Ingredient } from '@/entities/ingredient'
import { StockStatusBadge, formatQuantity, productQueries } from '@/entities/product'
import { canManageCatalog, useCurrentUser } from '@/entities/session'
import { IngredientDialog, MergeIngredientDialog } from '@/features/ingredient/manage'
import { paths, to } from '@/shared/config'
import { matchesSearch } from '@/shared/lib/arabic-search'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/field'
import { SkeletonRows } from '@/shared/ui/skeleton'

type Open =
  | { kind: 'add' }
  | { kind: 'rename'; ingredient: Ingredient }
  | { kind: 'merge'; ingredient: Ingredient; targetId: number | null }
  | null

function IngredientProducts({ ingredient }: { ingredient: Ingredient }) {
  const { t } = useTranslation()
  const { data, isPending } = useQuery(
    productQueries.list({
      tab: 'all',
      categoryId: null,
      ingredientId: ingredient.id,
      supplierId: null,
      sort: 'name',
      search: '',
      page: 1,
      perPage: 100,
    }),
  )
  if (isPending) return <SkeletonRows rows={4} />
  const products = data?.data ?? []
  if (products.length === 0) {
    return <p className="text-small text-ink-muted">{t('ingredients.noProducts')}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body">
        <caption className="sr-only">{ingredient.name}</caption>
        <thead>
          <tr className="border-b border-border text-small text-ink-muted">
            <th className="py-2 text-start font-semibold">{t('ingredients.columns.product')}</th>
            <th className="py-2 text-start font-semibold">{t('ingredients.columns.quantity')}</th>
            <th className="py-2 text-end font-semibold">{t('ingredients.columns.price')}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-border last:border-0">
              {/* The cell's text is the product name inside the link; the rule cannot see into <Link>. */}
              {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
              <td className="py-2.5">
                <bdi>
                  <Link
                    to={to(paths.productDetail, { id: product.id })}
                    className="font-semibold hover:text-brand-strong hover:underline"
                  >
                    {product.name}
                  </Link>
                </bdi>
              </td>
              <td className="py-2.5">
                <span className="flex flex-wrap items-center gap-2">
                  {product.quantity > 0 && (
                    <span className="tabular">
                      {formatQuantity(product.quantity, product.unit)}
                    </span>
                  )}
                  <StockStatusBadge status={product.status} active={product.active} />
                </span>
              </td>
              <td className="tabular py-2.5 text-end">{formatMoney(product.price)} ₪</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function IngredientsPage() {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  const canManage = user && 'pharmacy' in user ? canManageCatalog(user.role) : false
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<Open>(null)
  const { data: ingredients = [], isPending } = useQuery(ingredientQueries.list())
  const { data: duplicates = [] } = useQuery({
    ...ingredientQueries.duplicates(),
    enabled: canManage,
  })

  const visible = ingredients.filter((item) =>
    matchesSearch(`${item.name} ${item.nameAr ?? ''}`, search),
  )
  const selectedId = Number(params.get('id'))
  const selected =
    ingredients.find((item) => item.id === selectedId) ?? visible[0] ?? ingredients[0] ?? null
  const select = (id: number) => setParams({ id: String(id) }, { replace: true })
  const duplicate = duplicates[0]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('ingredients.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('ingredients.subtitle')}</p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen({ kind: 'add' })}>+ {t('ingredients.add')}</Button>
        )}
      </div>

      {canManage && duplicate && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning bg-warning-soft px-4 py-3">
          <p className="text-body">
            {t('ingredients.duplicate', { a: duplicate.keep.name, b: duplicate.merge.name })}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const ingredient = ingredients.find((item) => item.id === duplicate.merge.id)
              if (ingredient) {
                select(ingredient.id)
                setOpen({ kind: 'merge', ingredient, targetId: duplicate.keep.id })
              }
            }}
          >
            {t('ingredients.reviewMerge')}
          </Button>
        </div>
      )}

      {isPending ? (
        <SkeletonRows />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <nav
            aria-label={t('ingredients.list')}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface-100 shadow-card p-3"
          >
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('ingredients.search')}
              aria-label={t('ingredients.search')}
              className="h-9"
            />
            <ul className="flex max-h-[60vh] flex-col overflow-y-auto">
              {visible.map((item) => {
                const on = item.id === selected?.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={on ? 'true' : undefined}
                      onClick={() => select(item.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start',
                        on
                          ? 'bg-brand-soft font-semibold text-brand-strong'
                          : 'hover:bg-surface-200',
                      )}
                    >
                      <bdi>{item.name}</bdi>
                      <span className="tabular text-caption text-ink-muted">
                        {item.productCount}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {selected ? (
            <section
              aria-labelledby="ingredient-title"
              className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 shadow-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="ingredient-title" className="font-display text-title">
                    <bdi>{selected.name}</bdi>
                  </h2>
                  <p className="mt-0.5 text-small text-ink-muted">
                    {[
                      selected.nameAr,
                      selected.fromCatalog ? t('ingredients.fromCatalog') : t('ingredients.own'),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setOpen({ kind: 'rename', ingredient: selected })}
                    >
                      {t('ingredients.rename')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setOpen({ kind: 'merge', ingredient: selected, targetId: null })
                      }
                    >
                      {t('ingredients.merge')}
                    </Button>
                  </div>
                )}
              </div>
              <dl className="grid grid-cols-3 gap-3">
                {(
                  [
                    ['products', selected.productCount],
                    ['inStock', selected.inStockCount],
                    ['out', selected.productCount - selected.inStockCount],
                  ] as const
                ).map(([key, value]) => (
                  <div key={key} className="rounded-md bg-surface-200 p-3">
                    <dt className="text-small text-ink-muted">{t(`ingredients.stats.${key}`)}</dt>
                    <dd className="tabular font-display text-title">{value}</dd>
                  </div>
                ))}
              </dl>
              <IngredientProducts ingredient={selected} />
            </section>
          ) : (
            <EmptyState title={t('ingredients.pick')} />
          )}
        </div>
      )}

      {open?.kind === 'add' && (
        <IngredientDialog
          open
          onClose={() => setOpen(null)}
          onSaved={(saved) => select(saved.id)}
        />
      )}
      {open?.kind === 'rename' && (
        <IngredientDialog open ingredient={open.ingredient} onClose={() => setOpen(null)} />
      )}
      {open?.kind === 'merge' && (
        <MergeIngredientDialog
          open
          ingredient={open.ingredient}
          ingredients={ingredients}
          initialTargetId={open.targetId}
          onClose={() => setOpen(null)}
          onMerged={(targetId) => select(targetId)}
        />
      )}
    </div>
  )
}
