import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DAMAGE_REASONS,
  damageQueries,
  recordDamage,
  type DamageReason,
} from '@/entities/damage-record'
import { productQueries } from '@/entities/product'
import { ApiError } from '@/shared/api'
import { daysUntil, formatMonthYear } from '@/shared/lib/date'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Combobox } from '@/shared/ui/combobox'
import { Field, Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

const ALL_PRODUCTS = {
  tab: 'all',
  categoryId: null,
  ingredientId: null,
  supplierId: null,
  sort: 'name',
  search: '',
  page: 1,
  perPage: 100,
} as const

/** One product, one batch: how many left stock, why, and what it cost. */
export function RecordDamageForm({
  initialProductId = null,
}: {
  initialProductId?: number | null
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [productId, setProductId] = useState<number | null>(initialProductId)
  const [batchCode, setBatchCode] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState<DamageReason>('expired')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | undefined>()

  const { data: products } = useQuery(productQueries.list(ALL_PRODUCTS))
  const { data: product } = useQuery({
    ...productQueries.detail(productId ?? 0),
    enabled: productId !== null,
  })
  // Expired batches first: they are what usually gets written off.
  const batches = product?.batches ?? []
  const batch = batches.find((item) => item.code === batchCode) ?? batches[0] ?? null
  const amount = Number(quantity) || 0
  const cost = batch?.cost ?? 0

  const save = useMutation({
    mutationFn: () =>
      recordDamage({
        productId: productId ?? 0,
        batch: batch?.code ?? '',
        quantity: amount,
        reason,
        note: note.trim(),
      }),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: damageQueries.all })
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      toast.success(
        t('damage.saved', {
          quantity: record.quantity,
          unit: record.product.unit,
          name: record.product.name,
        }),
      )
      setQuantity('1')
      setNote('')
    },
    onError: (failure) =>
      setError(
        failure instanceof ApiError && failure.isValidation
          ? t('damage.tooMuch')
          : t('validation.serverError'),
      ),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    if (!productId || !batch) setError(t('damage.pickProduct'))
    else if (!(amount > 0)) setError(t('damage.positive'))
    else if (amount > batch.quantity) setError(t('damage.tooMuch'))
    else save.mutate()
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="damage-form-title"
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 p-5"
    >
      <h2 id="damage-form-title" className="font-display text-title">
        {t('damage.formTitle')}
      </h2>
      <Field label={t('damage.product')}>
        {(field) => (
          <Combobox
            {...field}
            value={productId === null ? null : String(productId)}
            onChange={(next) => {
              setProductId(next === null ? null : Number(next))
              setBatchCode(null)
            }}
            options={(products?.data ?? []).map((item) => ({
              value: String(item.id),
              label: item.name,
              meta: `${item.quantity} ${item.unit}`,
            }))}
          />
        )}
      </Field>
      {product && batches.length === 0 && (
        <p className="text-small text-ink-muted">{t('damage.noBatches')}</p>
      )}
      {batches.length > 0 && (
        <Field label={t('damage.batch')}>
          {(field) => (
            <select
              {...field}
              value={batch?.code ?? ''}
              onChange={(event) => setBatchCode(event.target.value)}
              className="h-10 rounded-md border border-border-strong bg-surface-100 px-3 text-body"
            >
              {batches.map((item) => (
                <option key={item.code} value={item.code}>
                  {t('damage.batchOption', {
                    batch: item.code,
                    expiry: formatMonthYear(item.expiry),
                    quantity: item.quantity,
                    unit: product?.unit ?? '',
                  })}
                  {daysUntil(item.expiry) < 0 ? ` · ${t('damage.expired')}` : ''}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}
      <Field label={t('damage.quantity')} error={error}>
        {(field) => (
          <span className="flex items-center gap-2">
            <Input
              {...field}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              inputMode="numeric"
              className="tabular w-24"
            />
            <span className="text-ink-muted">{product?.unit}</span>
          </span>
        )}
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-small font-semibold">{t('damage.reason')}</legend>
        <div className="flex flex-wrap gap-2">
          {DAMAGE_REASONS.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-body has-checked:border-brand has-checked:bg-brand-soft"
            >
              <input
                type="radio"
                name="damage-reason"
                checked={reason === item}
                onChange={() => setReason(item)}
                className="accent-brand"
              />
              {t(`damage.reasons.${item}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={t('damage.note')} optional>
        {(field) => (
          <Input {...field} value={note} onChange={(event) => setNote(event.target.value)} />
        )}
      </Field>
      <div className="flex items-center justify-between rounded-md bg-surface-200 px-3 py-2">
        <span className="text-small text-ink-muted">{t('damage.loss')}</span>
        <span className="tabular font-semibold">
          {t('damage.lossLine', {
            quantity: amount,
            cost: formatMoney(cost),
            total: formatMoney(roundMoney(amount * cost)),
          })}
        </span>
      </div>
      <Button type="submit" disabled={save.isPending}>
        {t('damage.save')}
      </Button>
    </form>
  )
}
