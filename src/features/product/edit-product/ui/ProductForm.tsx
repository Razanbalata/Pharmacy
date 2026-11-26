import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { categoryName, categoryQueries, createCategory } from '@/entities/category'
import { createIngredient, ingredientQueries } from '@/entities/ingredient'
import {
  DOSAGE_FORMS,
  createProduct,
  productQueries,
  updateProduct,
  type CatalogEntry,
  type Product,
} from '@/entities/product'
import { supplierQueries } from '@/entities/supplier'
import { internalEan13 } from '@/shared/lib/barcode'
import { applyServerErrors, useErrorText } from '@/shared/lib/forms'
import { formatMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Combobox } from '@/shared/ui/combobox'
import { Field, Input } from '@/shared/ui/field'
import { Switch } from '@/shared/ui/switch'
import { toast } from '@/shared/ui/toast'
import {
  emptyProduct,
  formToInput,
  productSchema,
  productToForm,
  type ProductFormInput,
  type ProductFormValues,
} from '../model/schema'
import { CatalogSearch } from './CatalogSearch'
import { UnitsEditor } from './UnitsEditor'

interface ProductFormProps {
  /** Editing this product; omitted to add a new one. */
  product?: Product
  defaultMinStock?: number
  /** After saving. `again` is true for "save and add another", which keeps the form open. */
  onSaved: (product: Product, again: boolean) => void
  onCancel: () => void
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 shadow-card p-5">
      <div>
        <h2 className="font-display text-title">{title}</h2>
        {hint && <p className="mt-0.5 text-small text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function ProductForm({ product, defaultMinStock = 5, onSaved, onCancel }: ProductFormProps) {
  const { t, i18n } = useTranslation()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const [filledFromCatalog, setFilledFromCatalog] = useState(false)
  const adding = !product

  const { data: ingredients = [] } = useQuery(ingredientQueries.list())
  const { data: categories = [] } = useQuery(categoryQueries.list())
  const { data: suppliers = [] } = useQuery(supplierQueries.options())

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? productToForm(product) : emptyProduct(defaultMinStock),
  })
  const { register, control, formState, handleSubmit, setError, setValue, reset } = form
  const errors = formState.errors
  const [name, ingredientId, units, prescription, hasOpening] = useWatch({
    control,
    name: ['name', 'ingredientId', 'units', 'prescription', 'hasOpening'],
  })
  const ingredientName = ingredients.find((item) => item.id === ingredientId)?.name

  const save = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const input = formToInput(values)
      return product ? updateProduct(product.id, input) : createProduct(input)
    },
  })

  const addIngredient = useMutation({
    mutationFn: (label: string) => createIngredient({ name: label, nameAr: null }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ingredientQueries.all })
      setValue('ingredientId', created.id, { shouldDirty: true })
    },
  })

  const addCategory = useMutation({
    mutationFn: (label: string) => createCategory({ nameAr: label, nameEn: '' }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: categoryQueries.all })
      setValue('categoryId', created.id, { shouldDirty: true })
    },
  })

  async function fillFromCatalog(entry: CatalogEntry) {
    let ingredient = entry.ingredient?.id ?? null
    if (ingredient === null && entry.ingredientName) {
      ingredient = (await addIngredient.mutateAsync(entry.ingredientName)).id
    }
    reset({
      ...emptyProduct(defaultMinStock),
      name: entry.name,
      nameAr: entry.nameAr ?? '',
      ingredientId: ingredient,
      form: entry.form,
      strength: entry.strength,
      manufacturer: entry.manufacturer,
      barcode: entry.barcode ?? '',
      prescription: entry.prescription,
      units: entry.units,
    })
    setFilledFromCatalog(true)
  }

  function submit(again: boolean) {
    return handleSubmit(async (values) => {
      try {
        const saved = await save.mutateAsync(values)
        await queryClient.invalidateQueries({ queryKey: productQueries.all })
        await queryClient.invalidateQueries({ queryKey: categoryQueries.all })
        await queryClient.invalidateQueries({ queryKey: ingredientQueries.all })
        toast.success(t('products.form.saved', { name: saved.name }))
        if (again) {
          reset(emptyProduct(defaultMinStock))
          setFilledFromCatalog(false)
        }
        onSaved(saved, again)
      } catch (error) {
        const message = applyServerErrors(error, setError, {
          taken: 'products.form.errors.barcodeTaken',
        })
        if (message) toast.error(t(message))
      }
    })
  }

  const first = units[0]
  const firstPrice = Number(first?.price)

  return (
    <form
      noValidate
      onSubmit={submit(false)}
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"
    >
      <div className="flex flex-col gap-5">
        {adding && <CatalogSearch onPick={(entry) => void fillFromCatalog(entry)} />}
        {filledFromCatalog && (
          <output className="block rounded-md bg-success-soft px-3 py-2 text-small text-success">
            {t('products.form.catalogFilled')}
          </output>
        )}

        <Section title={t('products.form.basics')}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t('products.form.name')} error={errorText(errors.name?.message)}>
              {(field) => <Input {...field} {...register('name')} dir="auto" />}
            </Field>
            <Field label={t('products.form.nameAr')} hint={t('products.form.nameArHint')} optional>
              {(field) => <Input {...field} {...register('nameAr')} />}
            </Field>
            <Field
              label={t('products.form.ingredient')}
              hint={t('products.form.ingredientHint')}
              optional
            >
              {(field) => (
                <Controller
                  control={control}
                  name="ingredientId"
                  render={({ field: { value, onChange } }) => (
                    <Combobox
                      {...field}
                      value={value === null ? null : String(value)}
                      onChange={(next) => onChange(next === null ? null : Number(next))}
                      onCreate={(label) => addIngredient.mutate(label)}
                      options={ingredients.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                        meta: t('categories.productCount', { count: item.productCount }),
                        keywords: item.nameAr ?? '',
                      }))}
                    />
                  )}
                />
              )}
            </Field>
            <Field label={t('products.form.dosageForm')} optional>
              {(field) => (
                <select
                  {...field}
                  {...register('form', { setValueAs: (value) => (value === '' ? null : value) })}
                  className="h-10 rounded-lg border border-border bg-surface-100 px-3 text-body"
                >
                  <option value="">{t('products.form.none')}</option>
                  {DOSAGE_FORMS.map((dosage) => (
                    <option key={dosage} value={dosage}>
                      {t(`products.forms.${dosage}`)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t('products.form.strength')} optional>
              {(field) => <Input {...field} {...register('strength')} />}
            </Field>
            <Field label={t('products.form.manufacturer')} optional>
              {(field) => <Input {...field} {...register('manufacturer')} dir="auto" />}
            </Field>
            <Field label={t('products.form.category')} optional>
              {(field) => (
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field: { value, onChange } }) => (
                    <Combobox
                      {...field}
                      value={value === null ? null : String(value)}
                      onChange={(next) => onChange(next === null ? null : Number(next))}
                      onCreate={(label) => addCategory.mutate(label)}
                      options={categories.map((item) => ({
                        value: String(item.id),
                        label: categoryName(item, i18n.language),
                        keywords: `${item.nameAr} ${item.nameEn}`,
                      }))}
                    />
                  )}
                />
              )}
            </Field>
            <Field
              label={t('products.form.barcode')}
              hint={t('products.form.barcodeHint')}
              error={errorText(errors.barcode?.message)}
              optional
            >
              {(field) => (
                <div className="flex gap-2">
                  <Input
                    {...field}
                    {...register('barcode')}
                    dir="ltr"
                    inputMode="numeric"
                    className="tabular grow text-start"
                  />
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setValue(
                        'barcode',
                        internalEan13(product?.id ?? Math.floor(Date.now() % 1e9)),
                        { shouldDirty: true },
                      )
                    }
                  >
                    {t('products.form.generateBarcode')}
                  </Button>
                </div>
              )}
            </Field>
          </div>
          <label className="flex items-center gap-3 text-body">
            <Switch {...register('prescription')} />
            {t('products.form.prescription')}
          </label>
        </Section>

        <Section title={t('products.form.units')} hint={t('products.form.unitsHint')}>
          <UnitsEditor control={control} register={register} errors={errors.units} />
        </Section>

        <Section title={t('products.form.stock')}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={t('products.form.minStock')}
              hint={t('products.form.minStockHint')}
              error={errorText(errors.minStock?.message)}
            >
              {(field) => (
                <span className="flex items-center gap-2">
                  <Input
                    {...field}
                    {...register('minStock')}
                    inputMode="numeric"
                    className="tabular w-24"
                  />
                  <span className="text-small text-ink-muted">{first?.name}</span>
                </span>
              )}
            </Field>
            <Field label={t('products.form.supplier')} optional>
              {(field) => (
                <Controller
                  control={control}
                  name="supplierId"
                  render={({ field: { value, onChange } }) => (
                    <Combobox
                      {...field}
                      value={value === null ? null : String(value)}
                      onChange={(next) => onChange(next === null ? null : Number(next))}
                      options={suppliers.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                      }))}
                    />
                  )}
                />
              )}
            </Field>
          </div>
          {adding && (
            <div className="flex flex-col gap-3 rounded-md bg-surface-200 p-4">
              <label className="flex items-center gap-3 text-body">
                <input
                  type="checkbox"
                  {...register('hasOpening')}
                  className="size-4 accent-brand"
                />
                {t('products.form.opening')}
              </label>
              {hasOpening && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label={t('products.form.openingQuantity')}
                    error={errorText(errors.opening?.quantity?.message)}
                  >
                    {(field) => (
                      <Input
                        {...field}
                        {...register('opening.quantity')}
                        inputMode="numeric"
                        className="tabular"
                      />
                    )}
                  </Field>
                  <Field
                    label={t('products.form.openingExpiry')}
                    error={errorText(errors.opening?.expiry?.message)}
                  >
                    {(field) => <Input {...field} type="date" {...register('opening.expiry')} />}
                  </Field>
                  <Field
                    label={t('products.form.openingCost')}
                    error={errorText(errors.opening?.cost?.message)}
                  >
                    {(field) => (
                      <Input
                        {...field}
                        {...register('opening.cost')}
                        inputMode="decimal"
                        className="tabular"
                      />
                    )}
                  </Field>
                </div>
              )}
              <p className="text-small text-ink-muted">{t('products.form.openingHint')}</p>
            </div>
          )}
        </Section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        <section className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
          <h2 className="text-small text-ink-muted">{t('products.form.preview')}</h2>
          <div className="mt-3 rounded-md border border-border p-3">
            <bdi className="block font-semibold">{name || t('products.form.name')}</bdi>
            {ingredientName && (
              <bdi className="block text-caption text-ink-muted">{ingredientName}</bdi>
            )}
            <div className="mt-2 flex items-center justify-between">
              {prescription ? <Badge tone="info">{t('products.prescription')}</Badge> : <span />}
              <span className="tabular font-display text-body-strong">
                {Number.isFinite(firstPrice) && firstPrice > 0 ? formatMoney(firstPrice) : '—'} ₪
              </span>
            </div>
          </div>
        </section>
        <label className="flex items-center gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-4 text-body">
          <Switch {...register('active')} />
          {t('products.form.active')}
        </label>
        <Button type="submit" size="lg" disabled={formState.isSubmitting}>
          {t('products.form.save')}
        </Button>
        {adding && (
          <Button variant="secondary" disabled={formState.isSubmitting} onClick={submit(true)}>
            {t('products.form.saveAndNew')}
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </aside>
    </form>
  )
}
