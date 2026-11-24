import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { pharmacyQueries } from '@/entities/pharmacy'
import { generateBarcode, getProduct, productQueries, type ProductDetail } from '@/entities/product'
import { useCurrentUser } from '@/entities/session'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMonthYear } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'
import { Barcode } from '@/shared/ui/barcode'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'

type LabelSize = '38x25' | '50x30' | 'a4'
const LABEL_FIELDS = ['name', 'price', 'barcode', 'expiry', 'pharmacy'] as const
type LabelField = (typeof LABEL_FIELDS)[number]
type LabelProduct = ProductDetail & { generated: boolean }

/** Real millimetres, so what prints matches the label roll. A4 is 4 × 10 on the sheet. */
const SIZE_STYLE: Record<LabelSize, { width: string; height: string }> = {
  '38x25': { width: '38mm', height: '25mm' },
  '50x30': { width: '50mm', height: '30mm' },
  a4: { width: '52.5mm', height: '29.7mm' },
}

function parseIds(value: string | null): number[] {
  return (value ?? '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0)
}

function Label({
  product,
  size,
  fields,
  pharmacy,
}: {
  product: ProductDetail
  size: LabelSize
  fields: ReadonlySet<LabelField>
  pharmacy: string
}) {
  const { t } = useTranslation()
  return (
    <div
      style={SIZE_STYLE[size]}
      className="flex flex-col justify-between overflow-hidden rounded-sm border border-dashed border-border-strong bg-white p-[1.5mm] text-black print:border-transparent"
    >
      {fields.has('pharmacy') && (
        <span className="truncate text-center text-[7px] leading-tight">{pharmacy}</span>
      )}
      {fields.has('name') && (
        <bdi className="truncate text-[9px] leading-tight font-semibold">{product.name}</bdi>
      )}
      {fields.has('barcode') && product.barcode && <Barcode code={product.barcode} />}
      <span className="flex items-baseline justify-between gap-1 text-[8px] leading-tight">
        {fields.has('expiry') && product.nearestExpiry ? (
          <span>{t('products.labels.exp', { date: formatMonthYear(product.nearestExpiry) })}</span>
        ) : (
          <span />
        )}
        {fields.has('price') && (
          <span className="tabular text-[10px] font-bold">{formatMoney(product.price)} ₪</span>
        )}
      </span>
    </div>
  )
}

export function ProductLabelsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const ids = parseIds(params.get('ids'))
  const [copies, setCopies] = useState<Record<number, number>>({})
  const [search, setSearch] = useState('')
  const [fields, setFields] = useState<Set<LabelField>>(
    new Set(['name', 'price', 'barcode', 'pharmacy']),
  )
  const { data: user } = useCurrentUser()
  const { data: settings } = useQuery(pharmacyQueries.settings())
  const [chosenSize, setSize] = useState<LabelSize | null>(null)
  const size: LabelSize = chosenSize ?? settings?.print.labelSize ?? '38x25'
  const pharmacy = user && 'pharmacy' in user ? user.pharmacy.name : ''

  // A product with no barcode gets an internal one when it is added here, and keeps it.
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['label', id],
      queryFn: async (): Promise<LabelProduct> => {
        const product = await getProduct(id)
        if (product.barcode) return { ...product, generated: false }
        const { barcode } = await generateBarcode(id)
        await queryClient.invalidateQueries({ queryKey: productQueries.detail(id).queryKey })
        return { ...product, barcode, generated: true }
      },
    })),
  })
  const products = results.flatMap((result) => (result.data ? [result.data] : []))
  const found = useQuery({
    ...productQueries.list({
      tab: 'all',
      categoryId: null,
      ingredientId: null,
      supplierId: null,
      sort: 'name',
      search,
      page: 1,
      perPage: 6,
    }),
    enabled: search.trim().length >= 2,
  })

  const generated = products.filter((product) => product.generated)

  const countOf = (id: number) => copies[id] ?? 1
  const total = products.reduce((sum, product) => sum + countOf(product.id), 0)
  const notEan = products.filter((product) => product.barcode && !/^\d{13}$/.test(product.barcode))

  function setIds(next: number[]) {
    setParams(next.length > 0 ? { ids: next.join(',') } : {}, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav aria-label={t('common.breadcrumb')} className="text-small text-ink-muted">
            <Link to={paths.products} className="text-brand-strong hover:underline">
              {t('products.title')}
            </Link>
            {' › '}
            {t('products.labels.title')}
          </nav>
          <h1 className="mt-1 font-display text-display">{t('products.labels.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('products.labels.subtitle')}</p>
        </div>
        <Button disabled={total === 0} onClick={() => window.print()}>
          {t('products.labels.print', { count: total })}
        </Button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-4">
            <h2 className="font-display text-body-strong">{t('products.labels.items')}</h2>
            {products.length === 0 && (
              <p className="text-small text-ink-muted">{t('products.labels.empty')}</p>
            )}
            <ul className="flex flex-col">
              {products.map((product) => {
                const count = countOf(product.id)
                const isNew = product.generated
                return (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0"
                  >
                    <span className="flex min-w-0 flex-col">
                      <bdi className="truncate font-semibold">{product.name}</bdi>
                      <span
                        className={cn(
                          'tabular text-caption',
                          isNew ? 'text-brand-strong' : 'text-ink-muted',
                        )}
                      >
                        <bdi dir="ltr">{product.barcode ?? '…'}</bdi>
                        {isNew && ` · ${t('products.labels.newCode')}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`${t('products.labels.decrease')}: ${product.name}`}
                        disabled={count <= 1}
                        onClick={() => setCopies({ ...copies, [product.id]: count - 1 })}
                      >
                        −
                      </Button>
                      <Input
                        aria-label={t('products.labels.copies', { name: product.name })}
                        value={count}
                        onChange={(event) => {
                          const value = Math.max(1, Math.min(200, Number(event.target.value) || 1))
                          setCopies({ ...copies, [product.id]: value })
                        }}
                        inputMode="numeric"
                        className="tabular h-8 w-12 text-center"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`${t('products.labels.increase')}: ${product.name}`}
                        onClick={() => setCopies({ ...copies, [product.id]: count + 1 })}
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t('products.labels.remove', { name: product.name })}
                        onClick={() => setIds(ids.filter((id) => id !== product.id))}
                      >
                        ✕
                      </Button>
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-col gap-1.5">
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('products.labels.addProduct')}
                aria-label={t('products.labels.addProduct')}
                className="h-9"
              />
              {search.trim().length >= 2 && (
                <ul className="overflow-hidden rounded-md border border-border">
                  {(found.data?.data ?? [])
                    .filter((product) => !ids.includes(product.id))
                    .map((product) => (
                      <li key={product.id} className="border-b border-border last:border-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIds([...ids, product.id])
                            setSearch('')
                          }}
                          className="w-full px-3 py-2 text-start hover:bg-surface-200"
                        >
                          + <bdi>{product.name}</bdi>
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-4">
            <h2 className="font-display text-body-strong">{t('products.labels.format')}</h2>
            <Segmented<LabelSize>
              label={t('products.labels.format')}
              value={size}
              onChange={setSize}
              options={(['38x25', '50x30', 'a4'] as const).map((value) => ({
                value,
                label: t(`products.labels.sizes.${value}`),
              }))}
            />
            <fieldset className="flex flex-wrap gap-x-5 gap-y-2">
              <legend className="mb-2 text-small text-ink-muted">
                {t('products.labels.show')}
              </legend>
              {LABEL_FIELDS.map((field) => (
                <label key={field} className="flex items-center gap-2 text-body">
                  <input
                    type="checkbox"
                    checked={fields.has(field)}
                    onChange={(event) => {
                      const next = new Set(fields)
                      if (event.target.checked) next.add(field)
                      else next.delete(field)
                      setFields(next)
                    }}
                    className="size-4 accent-brand"
                  />
                  {t(`products.labels.fields.${field}`)}
                </label>
              ))}
            </fieldset>
          </section>

          {generated.map((product) => (
            <p
              key={product.id}
              className="rounded-md bg-brand-soft px-3 py-2 text-small text-brand-strong"
            >
              {t('products.labels.generated', { name: product.name })}
            </p>
          ))}
          {notEan.map((product) => (
            <p
              key={product.id}
              className="rounded-md bg-warning-soft px-3 py-2 text-small text-warning"
            >
              {t('products.labels.notEan', { name: product.name })}
            </p>
          ))}
        </div>

        <section
          aria-labelledby="labels-preview"
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-4"
        >
          <h2 id="labels-preview" className="font-display text-body-strong">
            {t('products.labels.preview')}
          </h2>
          {products.length === 0 ? (
            <EmptyState title={t('products.labels.empty')} />
          ) : (
            <div className="print-area flex flex-wrap content-start gap-2 rounded-md bg-surface-200 p-3 print:gap-0 print:bg-white">
              {products.flatMap((product) =>
                Array.from({ length: countOf(product.id) }, (_, copy) => (
                  <Label
                    key={`${product.id}-${copy}`}
                    product={product}
                    size={size}
                    fields={fields}
                    pharmacy={pharmacy}
                  />
                )),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
