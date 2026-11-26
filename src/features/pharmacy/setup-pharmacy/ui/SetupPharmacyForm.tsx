import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import {
  chooseStartMethod,
  CityPicker,
  pharmacyQueries,
  updatePharmacyProfile,
  type StartMethod,
} from '@/entities/pharmacy'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { useErrorText } from '@/shared/lib/forms'
import { Button } from '@/shared/ui/button'
import { Field, Input } from '@/shared/ui/field'

const METHODS: StartMethod[] = ['excel', 'catalog', 'sample', 'empty']

/** Where each start method leads once the pharmacy is saved. */
const NEXT: Record<StartMethod, string> = {
  excel: `${paths.products}?import=1`,
  catalog: `${paths.products}?catalog=1`,
  sample: paths.gettingStarted,
  empty: paths.gettingStarted,
}

const required = z.string().trim().min(1, 'validation.required')
const schema = z.object({
  name: required,
  city: required,
  address: required,
  phone: required,
  licenseNumber: z.string().trim(),
  method: z.enum(['excel', 'catalog', 'sample', 'empty']),
})
type Values = z.infer<typeof schema>

/** Step 3 of joining: check the details from the request, then choose how to start. */
export function SetupPharmacyForm() {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: profile } = useSuspenseQuery(pharmacyQueries.profile())
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      city: profile.city,
      address: profile.address,
      phone: profile.phone,
      licenseNumber: profile.licenseNumber,
      method: 'excel',
    },
  })
  const mutation = useMutation({
    mutationFn: async ({ method, ...details }: Values) => {
      await updatePharmacyProfile({ ...details, currency: 'ILS' })
      await chooseStartMethod(method)
      return method
    },
    onSuccess: async (method) => {
      await queryClient.invalidateQueries({ queryKey: pharmacyQueries.all })
      void navigate(NEXT[method], { replace: true })
    },
  })
  const { register, handleSubmit, formState, control } = form
  const method = useWatch({ control, name: 'method' })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="grid items-start gap-5 lg:grid-cols-[1.1fr_1fr]"
    >
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 shadow-card p-6">
        <div>
          <h1 className="font-display text-heading">{t('auth.setup.title')}</h1>
          <p className="mt-1.5 text-small text-ink-muted">{t('auth.setup.subtitle')}</p>
        </div>
        <Field label={t('auth.setup.name')} error={errorText(formState.errors.name?.message)}>
          {(field) => <Input {...field} {...register('name')} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.setup.city')} error={errorText(formState.errors.city?.message)}>
            {(field) => (
              <Controller
                control={control}
                name="city"
                render={({ field: { value, onChange } }) => (
                  <CityPicker {...field} value={value} onChange={onChange} />
                )}
              />
            )}
          </Field>
          <Field label={t('auth.setup.license')} optional>
            {(field) => (
              <Input {...field} {...register('licenseNumber')} dir="ltr" className="text-start" />
            )}
          </Field>
        </div>
        <Field label={t('auth.setup.address')} error={errorText(formState.errors.address?.message)}>
          {(field) => <Input {...field} {...register('address')} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.setup.phone')} error={errorText(formState.errors.phone?.message)}>
            {(field) => (
              <Input
                {...field}
                {...register('phone')}
                inputMode="tel"
                dir="ltr"
                className="text-start"
              />
            )}
          </Field>
          <Field label={t('auth.setup.currency')}>
            {(field) => <Input {...field} value={t('auth.setup.shekel')} readOnly disabled />}
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-6">
        <div>
          <h2 className="font-display text-subheading">{t('auth.setup.startTitle')}</h2>
          <p className="mt-1.5 text-small text-ink-muted">{t('auth.setup.startSubtitle')}</p>
        </div>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="sr-only">{t('auth.setup.startTitle')}</legend>
          {METHODS.map((option) => (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer gap-3 rounded-lg border p-4 text-body',
                method === option ? 'border-2 border-brand bg-brand-soft/40' : 'border-border',
              )}
            >
              <input
                type="radio"
                value={option}
                {...register('method')}
                className="mt-1 accent-brand"
              />
              <span>
                <span className="block font-semibold">
                  {t(`auth.setup.methods.${option}.title`)}
                </span>
                <span className="text-small text-ink-muted">
                  {t(`auth.setup.methods.${option}.body`)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? t('auth.setup.submitting') : t('auth.setup.submit')}
        </Button>
      </section>
    </form>
  )
}
