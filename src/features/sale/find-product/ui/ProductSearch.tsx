import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { productQueries, type ProductSummary } from '@/entities/product'
import { cn } from '@/shared/lib/cn'
import { daysUntil, formatMonthYear } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'
import { SEARCH_INPUT_ID, useAddToCart } from '../model/use-add-to-cart'

const filters = (search: string) =>
  ({
    tab: 'all',
    categoryId: null,
    ingredientId: null,
    supplierId: null,
    sort: 'name',
    search,
    page: 1,
    perPage: 8,
  }) as const

function Alternatives({ product }: { product: ProductSummary }) {
  const { t } = useTranslation()
  const addToCart = useAddToCart()
  const { data } = useQuery(productQueries.detail(product.id))
  const available = (data?.alternatives ?? []).filter(
    (item) => item.quantity > 0 && item.status !== 'expired',
  )
  if (!data) return null
  if (available.length === 0) {
    return <p className="mt-2 text-small text-ink-muted">{t('pos.noAlternatives')}</p>
  }
  return (
    <div className="mt-2 rounded-md bg-surface-200 p-2">
      <p className="text-small text-ink-muted">{t('pos.alternatives')}</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {available.map((item) => (
          <li key={item.id}>
            <Button
              size="sm"
              variant="secondary"
              aria-label={t('pos.addName', { name: item.name })}
              onClick={() => void addToCart(item.id)}
            >
              <bdi>{item.name}</bdi> · {item.quantity} · {formatMoney(item.price)} ₪
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The search on the till. Arabic or English name, active ingredient, or a scanned barcode
 * (a scanner types the code and presses Enter). Arrows move, Enter adds.
 */
export function ProductSearch() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(0)
  const deferred = useDeferredValue(search)
  const searching = deferred.trim().length >= 2
  const { data } = useQuery({ ...productQueries.list(filters(deferred)), enabled: searching })
  const results = searching ? (data?.data ?? []).filter((item) => item.active) : []
  const addToCart = useAddToCart()

  // The till opens ready to scan.
  useEffect(() => {
    document.getElementById(SEARCH_INPUT_ID)?.focus()
  }, [])

  async function add(product: ProductSummary) {
    if (await addToCart(product.id)) {
      setSearch('')
      setActive(0)
      document.getElementById(SEARCH_INPUT_ID)?.focus()
    }
  }

  async function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, Math.max(0, results.length - 1)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Escape') {
      setSearch('')
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const exact = results.find((item) => item.barcode && item.barcode === search.trim())
      const target = exact ?? results[active]
      if (target) void add(target)
      else if (/^\d{8,}$/.test(search.trim()))
        toast.error(t('pos.noResults', { query: search.trim() }))
    }
  }

  return (
    <section aria-label={t('pos.search')} className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          id={SEARCH_INPUT_ID}
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setActive(0)
          }}
          onKeyDown={(event) => void onKeyDown(event)}
          placeholder={t('pos.search')}
          aria-label={t('pos.search')}
          autoComplete="off"
          className="h-12 grow text-body"
        />
        <kbd className="rounded border border-border px-1.5 text-caption text-ink-muted">F2</kbd>
      </div>
      {searching && (
        <p className="text-small text-ink-muted">
          {results.length > 0
            ? `${t('pos.results', { count: results.length, query: deferred })} · ${t('pos.keysHint')}`
            : t('pos.noResults', { query: deferred })}
        </p>
      )}
      <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto">
        {results.map((product, index) => {
          const out = product.quantity <= 0 || product.status === 'expired'
          const days = product.nearestExpiry ? daysUntil(product.nearestExpiry) : null
          return (
            <li
              key={product.id}
              className={cn(
                'rounded-lg border bg-surface-100 p-3',
                index === active ? 'border-2 border-brand' : 'border-border',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="flex flex-wrap items-center gap-2">
                    <bdi className="font-semibold">{product.name}</bdi>
                    {product.prescription && <Badge tone="info">{t('pos.prescription')}</Badge>}
                  </span>
                  {product.ingredient && (
                    <bdi className="text-caption text-ink-muted">{product.ingredient.name}</bdi>
                  )}
                  <span className="mt-1 flex flex-wrap gap-2 text-caption">
                    {out ? (
                      <Badge tone="neutral">{t('pos.outOfStock')}</Badge>
                    ) : product.status === 'soon' && days !== null ? (
                      <Badge tone="warning">{t('pos.expiresIn', { count: days })}</Badge>
                    ) : (
                      <Badge tone="success">
                        {t('pos.inStock', { quantity: product.quantity, unit: product.unit })}
                      </Badge>
                    )}
                    {!out && product.nearestExpiry && (
                      <span className="text-ink-muted">
                        {t('pos.nearest', { date: formatMonthYear(product.nearestExpiry) })}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="tabular font-display text-body-strong">
                    {formatMoney(product.price)} ₪
                  </span>
                  {!out && (
                    <Button
                      size="sm"
                      aria-label={t('pos.addName', { name: product.name })}
                      onClick={() => void add(product)}
                    >
                      {t('pos.add')} ↵
                    </Button>
                  )}
                </div>
              </div>
              {out && <Alternatives product={product} />}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
