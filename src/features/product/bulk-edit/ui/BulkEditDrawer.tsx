import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryName, categoryQueries } from '@/entities/category'
import {
  bulkUpdateProducts,
  productQueries,
  type BulkChanges,
  type ProductDetail,
} from '@/entities/product'
import { supplierQueries } from '@/entities/supplier'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Drawer } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

interface BulkEditDrawerProps {
  open: boolean
  ids: number[]
  onClose: () => void
  /** After the changes are saved. */
  onDone: () => void
}

type Field = 'minStock' | 'supplier' | 'category' | 'prescription' | 'active' | 'price'

const control = 'h-9 rounded-md border border-border-strong bg-surface-100 px-2 text-small'

function Row({
  field,
  label,
  hint,
  ticked,
  onTick,
  children,
}: {
  field: Field
  label: string
  hint?: string
  ticked: boolean
  onTick: (field: Field, on: boolean) => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
      <label className="flex min-w-44 items-center gap-2 text-body">
        <input
          type="checkbox"
          checked={ticked}
          onChange={(event) => onTick(field, event.target.checked)}
          aria-label={t('products.bulk.change', { field: label })}
          className="size-4 accent-brand"
        />
        <span aria-hidden>{label}</span>
      </label>
      <fieldset disabled={!ticked} className="flex items-center gap-2 disabled:opacity-50">
        <legend className="sr-only">{label}</legend>
        {children}
      </fieldset>
      {hint && <span className="text-small text-ink-muted">{hint}</span>}
    </div>
  )
}

/**
 * Change several products at once. Only ticked fields change; everything else stays as it
 * is on each product. A preview shows each product before and after.
 */
export function BulkEditDrawer({ open, ids, onClose, onDone }: BulkEditDrawerProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { data: suppliers = [] } = useQuery(supplierQueries.options())
  const { data: categories = [] } = useQuery(categoryQueries.list())
  const details = useQueries({
    queries: ids.map((id) => ({ ...productQueries.detail(id), enabled: open })),
  })
  const products = details.flatMap((result) => (result.data ? [result.data] : []))

  const [ticked, setTicked] = useState<Set<Field>>(new Set())
  const [minStock, setMinStock] = useState('10')
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [prescription, setPrescription] = useState(true)
  const [active, setActive] = useState(true)
  const [percent, setPercent] = useState('5')

  const on = (field: Field) => ticked.has(field)
  function tick(field: Field, value: boolean) {
    setTicked((current) => {
      const next = new Set(current)
      if (value) next.add(field)
      else next.delete(field)
      return next
    })
  }

  const minStockValue = Number(minStock)
  const percentValue = Number(percent)
  const changes: BulkChanges = {
    ...(on('minStock') && Number.isFinite(minStockValue) && minStockValue >= 0
      ? { minStock: minStockValue }
      : {}),
    ...(on('supplier') && supplierId !== null ? { supplierId } : {}),
    ...(on('category') && categoryId !== null ? { categoryId } : {}),
    ...(on('prescription') ? { prescription } : {}),
    ...(on('active') ? { active } : {}),
    ...(on('price') && Number.isFinite(percentValue) && percentValue !== 0
      ? { pricePercent: percentValue }
      : {}),
  }
  const changed = Object.keys(changes).length > 0
  const supplierName = (id: number | null | undefined) =>
    suppliers.find((item) => item.id === id)?.name ?? '—'
  const categoryLabel = (id: number | null | undefined) => {
    const category = categories.find((item) => item.id === id)
    return category ? categoryName(category, i18n.language) : '—'
  }
  const belowMin =
    changes.minStock === undefined
      ? 0
      : products.filter((product) => product.quantity <= (changes.minStock ?? 0)).length

  const apply = useMutation({
    mutationFn: () => bulkUpdateProducts(ids, changes),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      await queryClient.invalidateQueries({ queryKey: categoryQueries.all })
      toast.success(t('products.bulk.applied', { count: ids.length }))
      setTicked(new Set())
      onDone()
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  const columns: {
    field: Field
    label: string
    before: (p: ProductDetail) => string
    after: (p: ProductDetail) => string
  }[] = [
    {
      field: 'minStock',
      label: t('products.bulk.minStock'),
      before: (p) => String(p.minStock),
      after: () => String(changes.minStock),
    },
    {
      field: 'supplier',
      label: t('products.bulk.supplier'),
      before: (p) => p.supplier?.name ?? '—',
      after: () => supplierName(changes.supplierId),
    },
    {
      field: 'category',
      label: t('products.bulk.category'),
      before: (p) => (p.category ? categoryName(p.category, i18n.language) : '—'),
      after: () => categoryLabel(changes.categoryId),
    },
    {
      field: 'prescription',
      label: t('products.bulk.prescription'),
      before: (p) => t(p.prescription ? 'products.bulk.yes' : 'products.bulk.no'),
      after: () => t(changes.prescription ? 'products.bulk.yes' : 'products.bulk.no'),
    },
    {
      field: 'active',
      label: t('products.bulk.status'),
      before: (p) => t(p.active ? 'products.bulk.active' : 'products.bulk.stopped'),
      after: () => t(changes.active ? 'products.bulk.active' : 'products.bulk.stopped'),
    },
    {
      field: 'price',
      label: t('products.columns.price'),
      before: (p) => formatMoney(p.price),
      after: (p) => formatMoney(roundMoney(p.price * (1 + (changes.pricePercent ?? 0) / 100))),
    },
  ]
  const shown = columns.filter((column) => {
    const key = {
      minStock: 'minStock',
      supplier: 'supplierId',
      category: 'categoryId',
      prescription: 'prescription',
      active: 'active',
      price: 'pricePercent',
    }[column.field]
    return key in changes
  })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('products.bulk.title', { count: ids.length })}
      description={products.map((product) => product.name).join(' · ')}
      bodyClassName="flex flex-col gap-4"
      footer={
        <div className="flex w-full flex-col gap-2">
          <div className="flex gap-2">
            <Button disabled={!changed || apply.isPending} onClick={() => apply.mutate()}>
              {t('products.bulk.apply', { count: ids.length })}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
          <p className="text-caption text-ink-muted">{t('products.bulk.logged')}</p>
        </div>
      }
    >
      <p className="text-small text-ink-muted">{t('products.bulk.hint')}</p>
      <div className="rounded-lg border border-border px-4">
        <Row
          field="minStock"
          label={t('products.bulk.minStock')}
          hint={t('products.bulk.minStockHint')}
          ticked={on('minStock')}
          onTick={tick}
        >
          <Input
            aria-label={t('products.bulk.minStock')}
            value={minStock}
            onChange={(event) => setMinStock(event.target.value)}
            inputMode="numeric"
            className="tabular h-9 w-20"
          />
        </Row>
        <Row
          field="supplier"
          label={t('products.bulk.supplier')}
          ticked={on('supplier')}
          onTick={tick}
        >
          <select
            aria-label={t('products.bulk.supplier')}
            value={supplierId ?? ''}
            onChange={(event) =>
              setSupplierId(event.target.value ? Number(event.target.value) : null)
            }
            className={control}
          >
            <option value="">{t('products.bulk.choose')}</option>
            {suppliers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Row>
        <Row
          field="category"
          label={t('products.bulk.category')}
          ticked={on('category')}
          onTick={tick}
        >
          <select
            aria-label={t('products.bulk.category')}
            value={categoryId ?? ''}
            onChange={(event) =>
              setCategoryId(event.target.value ? Number(event.target.value) : null)
            }
            className={control}
          >
            <option value="">{t('products.bulk.choose')}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {categoryName(item, i18n.language)}
              </option>
            ))}
          </select>
        </Row>
        <Row
          field="prescription"
          label={t('products.bulk.prescription')}
          ticked={on('prescription')}
          onTick={tick}
        >
          <select
            aria-label={t('products.bulk.prescription')}
            value={prescription ? 'yes' : 'no'}
            onChange={(event) => setPrescription(event.target.value === 'yes')}
            className={control}
          >
            <option value="yes">{t('products.bulk.yes')}</option>
            <option value="no">{t('products.bulk.no')}</option>
          </select>
        </Row>
        <Row field="active" label={t('products.bulk.status')} ticked={on('active')} onTick={tick}>
          <select
            aria-label={t('products.bulk.status')}
            value={active ? 'active' : 'stopped'}
            onChange={(event) => setActive(event.target.value === 'active')}
            className={control}
          >
            <option value="active">{t('products.bulk.active')}</option>
            <option value="stopped">{t('products.bulk.stopped')}</option>
          </select>
        </Row>
        <Row
          field="price"
          label={t('products.bulk.price')}
          hint={t('products.bulk.priceHint')}
          ticked={on('price')}
          onTick={tick}
        >
          <Input
            aria-label={t('products.bulk.price')}
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
            inputMode="decimal"
            dir="ltr"
            className="tabular h-9 w-20"
          />
          <span className="text-small">%</span>
        </Row>
      </div>

      <section aria-labelledby="bulk-preview" className="flex flex-col gap-2">
        <h3 id="bulk-preview" className="font-display text-body-strong">
          {t('products.bulk.preview')}
        </h3>
        {shown.length === 0 ? (
          <p className="text-small text-ink-muted">{t('products.bulk.nothing')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-small">
              <caption className="sr-only">{t('products.bulk.preview')}</caption>
              <thead>
                <tr className="border-b border-border text-ink-muted">
                  <th className="px-3 py-2 text-start font-semibold">
                    {t('products.columns.product')}
                  </th>
                  {shown.map((column) => (
                    <th key={column.field} className="px-3 py-2 text-start font-semibold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0">
                    <th scope="row" className="min-w-36 px-3 py-2 text-start font-normal">
                      <bdi>{product.name}</bdi>
                    </th>
                    {shown.map((column) => (
                      <td key={column.field} className="px-3 py-2 whitespace-nowrap">
                        <span className="text-ink-muted">{column.before(product)}</span>
                        {i18n.dir() === 'rtl' ? ' ← ' : ' → '}
                        <span className="font-semibold">{column.after(product)}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {belowMin > 0 && (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-warning">
            {t('products.bulk.belowMin', { count: belowMin })}
          </p>
        )}
      </section>
    </Drawer>
  )
}
