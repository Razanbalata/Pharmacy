import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  CityPicker,
  pharmacyQueries,
  updatePharmacyProfile,
  updateSettings,
  type PharmacyProfile,
  type PharmacySettings,
} from '@/entities/pharmacy'
import { useErrorText } from '@/shared/lib/forms'
import { Button } from '@/shared/ui/button'
import { Field, Input, Textarea } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { Switch } from '@/shared/ui/switch'
import { toast } from '@/shared/ui/toast'
import { settingsSchema, type SettingsFormInput, type SettingsFormValues } from '../model/schema'

export function SettingsSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-6 flex-col gap-1 rounded-lg border border-border bg-surface-100 shadow-card px-5 py-4"
    >
      <h2 id={`${id}-title`} className="pb-2 font-display text-subheading">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** One setting: label and hint on the start side, the control on the end side. */
export function SettingRow({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-surface-200 py-3">
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-body">
            {label}
          </label>
        ) : (
          <p className="text-body">{label}</p>
        )}
        {hint && <p className="text-caption text-ink-muted">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function toForm(profile: PharmacyProfile, settings: PharmacySettings): SettingsFormInput {
  return {
    profile: {
      name: profile.name,
      city: profile.city,
      address: profile.address,
      phone: profile.phone,
      licenseNumber: profile.licenseNumber,
    },
    sale: settings.sale,
    stock: settings.stock,
    print: settings.print,
  }
}

interface SettingsFormProps {
  profile: PharmacyProfile
  settings: PharmacySettings
  /** Extra sections (subscription, backup, language) placed after the editable ones. */
  children?: ReactNode
}

/**
 * Pharmacy details and every setting in one form, with one save button.
 * "Unsaved changes" shows as soon as anything differs from what is saved.
 */
export function SettingsForm({ profile, settings, children }: SettingsFormProps) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const queryClient = useQueryClient()
  const form = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: toForm(profile, settings),
  })
  const { register, control, formState, handleSubmit } = form

  const mutation = useMutation({
    mutationFn: async ({ profile: details, ...rest }: SettingsFormValues) => {
      await updatePharmacyProfile({ ...details, currency: 'ILS' })
      await updateSettings(rest)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pharmacyQueries.all })
      toast.success(t('settings.saved'))
    },
  })

  const number = (name: Parameters<typeof register>[0], suffix: string) => (
    <span className="flex items-center gap-2">
      <Input id={name} {...register(name)} inputMode="numeric" className="tabular w-24" />
      <span className="text-small text-ink-muted">{suffix}</span>
    </span>
  )

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="flex flex-col gap-4"
    >
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-3 bg-surface-0/90 px-1 py-2 backdrop-blur">
        {formState.isDirty && (
          <span className="text-small text-warning">{t('settings.unsaved')}</span>
        )}
        <Button type="submit" disabled={!formState.isDirty || mutation.isPending}>
          {mutation.isPending ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>

      <SettingsSection id="pharmacy" title={t('settings.sections.pharmacy')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('auth.setup.name')}
            error={errorText(formState.errors.profile?.name?.message)}
          >
            {(field) => <Input {...field} {...register('profile.name')} />}
          </Field>
          <Field label={t('auth.setup.license')} optional>
            {(field) => (
              <Input
                {...field}
                {...register('profile.licenseNumber')}
                dir="ltr"
                className="text-start"
              />
            )}
          </Field>
          <Field
            label={t('auth.setup.city')}
            error={errorText(formState.errors.profile?.city?.message)}
          >
            {(field) => (
              <Controller
                control={control}
                name="profile.city"
                render={({ field: { value, onChange } }) => (
                  <CityPicker {...field} value={value} onChange={onChange} />
                )}
              />
            )}
          </Field>
          <Field
            label={t('auth.setup.phone')}
            error={errorText(formState.errors.profile?.phone?.message)}
          >
            {(field) => (
              <Input {...field} {...register('profile.phone')} dir="ltr" className="text-start" />
            )}
          </Field>
          <Field
            label={t('auth.setup.address')}
            className="sm:col-span-2"
            error={errorText(formState.errors.profile?.address?.message)}
          >
            {(field) => <Input {...field} {...register('profile.address')} />}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection id="sale" title={t('settings.sections.sale')}>
        <SettingRow label={t('settings.currency')} hint={t('settings.currencyHint')}>
          <span className="text-body">{t('auth.setup.shekel')}</span>
        </SettingRow>
        <SettingRow label={t('settings.paymentMethods')}>
          <div className="flex min-w-72 flex-col gap-2.5">
            <label className="flex items-center gap-2.5">
              <Switch {...register('sale.paymentMethods.cash')} />
              {t('settings.cash')}
            </label>
            <label className="flex items-center gap-2.5">
              <Switch {...register('sale.paymentMethods.bankApp')} />
              {t('settings.bankApp')}
            </label>
            <Input
              aria-label={t('settings.bankAppNames')}
              {...register('sale.bankAppNames')}
              className="h-9 text-small"
            />
            <label className="flex items-center gap-2.5">
              <Switch {...register('sale.paymentMethods.credit')} />
              {t('settings.credit')}
            </label>
          </div>
        </SettingRow>
        <SettingRow
          label={t('settings.debtLimit')}
          hint={t('settings.debtLimitHint')}
          htmlFor="sale.defaultDebtLimit"
        >
          {number('sale.defaultDebtLimit', t('settings.shekel'))}
        </SettingRow>
        <SettingRow
          label={t('settings.returnDays')}
          hint={t('settings.returnDaysHint')}
          htmlFor="sale.returnDays"
        >
          {number('sale.returnDays', t('settings.days'))}
        </SettingRow>
        <SettingRow
          label={t('settings.shifts')}
          hint={t('settings.shiftsHint')}
          htmlFor="sale.shiftsEnabled"
        >
          <Switch id="sale.shiftsEnabled" {...register('sale.shiftsEnabled')} />
        </SettingRow>
        <SettingRow
          label={t('settings.sellByUnit')}
          hint={t('settings.sellByUnitHint')}
          htmlFor="sale.sellByUnit"
        >
          <Switch id="sale.sellByUnit" {...register('sale.sellByUnit')} />
        </SettingRow>
        <SettingRow
          label={t('settings.sellAtZero')}
          hint={t('settings.sellAtZeroHint')}
          htmlFor="sale.sellAtZero"
        >
          <Switch id="sale.sellAtZero" {...register('sale.sellAtZero')} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection id="stock" title={t('settings.sections.stock')}>
        <SettingRow label={t('settings.expiryDays')} htmlFor="stock.expiryAlertDays">
          {number('stock.expiryAlertDays', t('settings.days'))}
        </SettingRow>
        <SettingRow
          label={t('settings.minStock')}
          hint={t('settings.minStockHint')}
          htmlFor="stock.defaultMinStock"
        >
          {number('stock.defaultMinStock', t('settings.unitBox'))}
        </SettingRow>
        <SettingRow label={t('settings.fefo')} hint={t('settings.fefoHint')}>
          <span className="text-small font-semibold text-success">{t('settings.alwaysOn')}</span>
        </SettingRow>
        <SettingRow
          label={t('settings.digest')}
          hint={t('settings.digestHint')}
          htmlFor="stock.dailyDigest"
        >
          <Switch id="stock.dailyDigest" {...register('stock.dailyDigest')} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection id="print" title={t('settings.sections.print')}>
        <SettingRow label={t('settings.receiptSize')}>
          <Controller
            control={control}
            name="print.receiptSize"
            render={({ field }) => (
              <Segmented
                label={t('settings.receiptSize')}
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: '80mm', label: '80 ملم' },
                  { value: '58mm', label: '58 ملم' },
                  { value: 'A4', label: 'A4' },
                ]}
              />
            )}
          />
        </SettingRow>
        <SettingRow label={t('settings.autoPrint')} htmlFor="print.autoPrint">
          <Switch id="print.autoPrint" {...register('print.autoPrint')} />
        </SettingRow>
        <SettingRow label={t('settings.footer')} htmlFor="print.footer">
          <Textarea id="print.footer" {...register('print.footer')} className="w-full sm:w-80" />
        </SettingRow>
        <SettingRow label={t('settings.labelSize')}>
          <Controller
            control={control}
            name="print.labelSize"
            render={({ field }) => (
              <Segmented
                label={t('settings.labelSize')}
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: '38x25', label: '38 × 25' },
                  { value: '50x30', label: '50 × 30' },
                ]}
              />
            )}
          />
        </SettingRow>
      </SettingsSection>

      {children}
    </form>
  )
}
