import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { productQueries } from '@/entities/product'
import {
  createOrder,
  markOrderSent,
  purchaseQueries,
  updateOrder,
  type OrderInput,
  type PurchaseOrder,
} from '@/entities/purchase-order'
import { useCurrentUser } from '@/entities/session'
import { supplierQueries } from '@/entities/supplier'
import { cn } from '@/shared/lib/cn'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { whatsappLink } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Combobox } from '@/shared/ui/combobox'
import { Field, Input, Textarea } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

interface Line {
  productId: number
  name: string
  unit: string
  stock: number
  minStock: number
  quantity: string
  cost: string
}

interface OrderFormProps {
  /** The draft being finished; omitted for a new order. */
  order?: PurchaseOrder
  initialSupplierId?: number | null
  /** After saving a new order, so the page can move to its address. */
  onCreated: (order: PurchaseOrder) => void
  /** After "goods arrived": go to receiving. */
  onReceive: (order: PurchaseOrder) => void
  extraActions?: ReactNode
}

function fromOrder(order: PurchaseOrder | undefined): Line[] {
  return (
    order?.lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      unit: line.unit,
      stock: line.stock,
      minStock: line.minStock,
      quantity: String(line.quantity),
      cost: String(line.cost),
    })) ?? []
  )
}

/** A draft order: supplier, products with quantity and cost, a note. Sent on WhatsApp. */
export function OrderForm({
  order,
  initialSupplierId = null,
  onCreated,
  onReceive,
  extraActions,
}: OrderFormProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const [supplierId, setSupplierId] = useState<number | null>(
    order?.supplier.id ?? initialSupplierId,
  )
  const [lines, setLines] = useState<Line[]>(() => fromOrder(order))
  const [note, setNote] = useState(order?.note ?? '')
  const [search, setSearch] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  const { data: suppliers } = useQuery(supplierQueries.list())
  const { data: suggestions = [] } = useQuery(purchaseQueries.suggestions())
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
  const supplier = suppliers?.data.find((item) => item.id === supplierId)
  const shortages = (
    suggestions.find((group) => group.supplier.id === supplierId)?.lines ?? []
  ).filter((line) => !lines.some((item) => item.productId === line.productId))

  const total = roundMoney(
    lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.cost) || 0), 0),
  )
  const units = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })

  function update(productId: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line) => (line.productId === productId ? { ...line, ...patch } : line)),
    )
  }

  async function addProduct(productId: number) {
    setSearch('')
    if (lines.some((line) => line.productId === productId)) return
    const product = await queryClient.fetchQuery(productQueries.detail(productId))
    const cost =
      product.batches.at(-1)?.cost ?? product.averageCost ?? roundMoney(product.price * 0.7)
    setLines((current) => [
      ...current,
      {
        productId,
        name: product.name,
        unit: product.unit,
        stock: product.quantity,
        minStock: product.minStock,
        quantity: String(Math.max(1, product.minStock * 2 - product.quantity)),
        cost: String(cost),
      },
    ])
  }

  function input(): OrderInput | null {
    setProblem(null)
    if (supplierId === null) {
      setProblem(t('purchases.form.chooseSupplier'))
      return null
    }
    if (lines.length === 0) {
      setProblem(t('purchases.form.needLines'))
      return null
    }
    const parsed = lines.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
      cost: Number(line.cost),
    }))
    if (parsed.some((line) => !(line.quantity > 0) || !(line.cost > 0))) {
      setProblem(t('purchases.form.quantityInvalid'))
      return null
    }
    return { supplierId, lines: parsed, note: note.trim() }
  }

  const save = useMutation({
    mutationFn: async (values: OrderInput) =>
      order ? updateOrder(order.id, values) : createOrder(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseQueries.all }),
    onError: () => toast.error(t('validation.serverError')),
  })

  async function saveDraft() {
    const values = input()
    if (!values) return
    const saved = await save.mutateAsync(values)
    toast.success(t('purchases.form.saved', { number: saved.number }))
    if (!order) onCreated(saved)
  }

  async function send(then: 'whatsapp' | 'receive') {
    const values = input()
    if (!values) return
    const saved = await save.mutateAsync(values)
    const sent = await markOrderSent(saved.id)
    await queryClient.invalidateQueries({ queryKey: purchaseQueries.all })
    if (then === 'whatsapp') {
      const pharmacy = user && 'pharmacy' in user ? user.pharmacy.name : ''
      const text = [
        t('purchases.form.whatsapp', { pharmacy, number: sent.number }),
        ...sent.lines.map((line) => `• ${line.name} × ${line.quantity}`),
        sent.note,
      ]
        .filter(Boolean)
        .join('\n')
      window.open(whatsappLink(sent.supplier.phone, text), '_blank', 'noopener')
      toast.success(t('purchases.form.sent', { number: sent.number }))
      if (!order) onCreated(sent)
    } else {
      onReceive(sent)
    }
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-5">
          <Field label={t('purchases.form.supplier')}>
            {(field) => (
              <Combobox
                {...field}
                value={supplierId === null ? null : String(supplierId)}
                onChange={(next) => setSupplierId(next === null ? null : Number(next))}
                options={(suppliers?.data ?? []).map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
                disabled={!!order}
              />
            )}
          </Field>
          {supplier && (
            <p className="flex flex-wrap gap-x-4 text-small text-ink-muted">
              <span className={cn(supplier.balance > 0 && 'text-warning')}>
                {t('purchases.form.owed', { amount: formatMoney(supplier.balance) })}
              </span>
              {supplier.lastOrder && (
                <span>
                  {t('purchases.form.lastOrder')}{' '}
                  <bdi dir="ltr">
                    {supplier.lastOrder.number} · {date.format(new Date(supplier.lastOrder.date))}
                  </bdi>
                </span>
              )}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            {shortages.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setLines((current) => [
                    ...current,
                    ...shortages.map((line) => ({
                      productId: line.productId,
                      name: line.name,
                      unit: line.unit,
                      stock: line.stock,
                      minStock: line.minStock,
                      quantity: String(line.quantity),
                      cost: String(line.cost),
                    })),
                  ])
                }
              >
                + {t('purchases.form.addLow', { count: shortages.length })}
              </Button>
            )}
            <div className="relative grow">
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('purchases.form.addProduct')}
                aria-label={t('purchases.form.addProduct')}
                className="h-9"
              />
              {search.trim().length >= 2 && (found.data?.data.length ?? 0) > 0 && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-border bg-surface-100 shadow-card">
                  {found.data?.data.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => void addProduct(product.id)}
                        className="w-full px-3 py-2 text-start hover:bg-surface-200"
                      >
                        + <bdi>{product.name}</bdi>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-md bg-surface-200 p-4 text-center text-small text-ink-muted">
              {t('purchases.form.empty')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <caption className="sr-only">{t('purchases.form.columns.product')}</caption>
                <thead>
                  <tr className="border-b border-border text-small text-ink-muted">
                    <th className="px-2 py-2 text-start font-semibold">
                      {t('purchases.form.columns.product')}
                    </th>
                    <th className="px-2 py-2 text-start font-semibold">
                      {t('purchases.form.columns.stock')}
                    </th>
                    <th className="px-2 py-2 text-start font-semibold">
                      {t('purchases.form.columns.quantity')}
                    </th>
                    <th className="px-2 py-2 text-start font-semibold">
                      {t('purchases.form.columns.cost')}
                    </th>
                    <th className="px-2 py-2 text-end font-semibold">
                      {t('purchases.form.columns.total')}
                    </th>
                    <th className="px-2 py-2">
                      <span className="sr-only">{t('purchases.form.remove', { name: '' })}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const quantity = Number(line.quantity) || 0
                    return (
                      <tr key={line.productId} className="border-b border-border last:border-0">
                        <th scope="row" className="px-2 py-2.5 text-start font-normal">
                          <bdi className="block font-semibold">{line.name}</bdi>
                          {line.stock <= line.minStock && (
                            <span className="text-caption text-warning">
                              {t('purchases.form.belowMin')}
                            </span>
                          )}
                        </th>
                        <td className="tabular px-2 py-2.5 text-ink-muted">
                          {line.stock} · {line.minStock}
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              aria-label={t('purchases.form.decrease', { name: line.name })}
                              disabled={quantity <= 1}
                              onClick={() =>
                                update(line.productId, { quantity: String(quantity - 1) })
                              }
                            >
                              −
                            </Button>
                            <Input
                              aria-label={t('purchases.form.quantityOf', { name: line.name })}
                              value={line.quantity}
                              onChange={(event) =>
                                update(line.productId, { quantity: event.target.value })
                              }
                              inputMode="numeric"
                              className="tabular h-8 w-14 text-center"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              aria-label={t('purchases.form.increase', { name: line.name })}
                              onClick={() =>
                                update(line.productId, { quantity: String(quantity + 1) })
                              }
                            >
                              +
                            </Button>
                            <span className="text-small text-ink-muted">{line.unit}</span>
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <Input
                            aria-label={t('purchases.form.costOf', { name: line.name })}
                            value={line.cost}
                            onChange={(event) =>
                              update(line.productId, { cost: event.target.value })
                            }
                            inputMode="decimal"
                            className="tabular h-8 w-20"
                          />
                        </td>
                        <td className="tabular px-2 py-2.5 text-end">
                          {formatMoney(quantity * (Number(line.cost) || 0))}
                        </td>
                        <td className="px-2 py-2.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={t('purchases.form.remove', { name: line.name })}
                            onClick={() =>
                              setLines((current) =>
                                current.filter((item) => item.productId !== line.productId),
                              )
                            }
                          >
                            ✕
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Field label={t('purchases.form.note')} optional>
            {(field) => (
              <Textarea
                {...field}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
              />
            )}
          </Field>
        </section>
      </div>

      <aside className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-4 lg:sticky lg:top-20">
        <p className="text-small text-ink-muted">
          {t('purchases.form.count', { lines: lines.length, units })}
        </p>
        <p className="flex items-baseline justify-between">
          <span>{t('purchases.form.total')}</span>
          <span className="tabular font-display text-title">{formatMoney(total)} ₪</span>
        </p>
        <p className="text-caption text-ink-muted">{t('purchases.form.later')}</p>
        {problem && (
          <p role="alert" className="text-small text-danger">
            {problem}
          </p>
        )}
        <Button disabled={save.isPending} onClick={() => void send('whatsapp')}>
          {t('purchases.form.send')}
        </Button>
        <Button variant="secondary" disabled={save.isPending} onClick={() => void send('receive')}>
          {t('purchases.form.receiveNow')}
        </Button>
        <Button variant="secondary" disabled={save.isPending} onClick={() => void saveDraft()}>
          {t('purchases.form.saveDraft')}
        </Button>
        {extraActions}
      </aside>
    </div>
  )
}
