import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { submitJoinRequest } from '@/entities/join-request'
import { CityPicker } from '@/entities/pharmacy'
import { applyServerErrors, useErrorText } from '@/shared/lib/forms'
import { Button } from '@/shared/ui/button'
import { Field, Input } from '@/shared/ui/field'
import { joinSchema, type JoinFormInput, type JoinFormValues } from '../model/schema'

interface JoinRequestFormProps {
  onSent: (result: { reference: string; phone: string }) => void
}

/** The public form a pharmacy fills to ask to join. No account is made here. */
export function JoinRequestForm({ onSent }: JoinRequestFormProps) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const [problem, setProblem] = useState<string | null>(null)
  const form = useForm<JoinFormInput, unknown, JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      pharmacyName: '',
      ownerName: '',
      city: '',
      phone: '',
      licenseNumber: '',
      terms: false as unknown as true,
    },
  })
  const { register, handleSubmit, formState, control, setError } = form

  const mutation = useMutation({
    mutationFn: ({ terms: _terms, ...input }: JoinFormValues) => submitJoinRequest(input),
    onSuccess: (result, values) => onSent({ reference: result.reference, phone: values.phone }),
    onError: (error) => {
      const message = applyServerErrors(error, setError, { taken: 'validation.phoneTaken' })
      setProblem(message ? t(message) : null)
    },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => {
        setProblem(null)
        mutation.mutate(values)
      })}
      className="flex flex-col gap-4"
    >
      <Field
        label={t('auth.join.pharmacyName')}
        error={errorText(formState.errors.pharmacyName?.message)}
      >
        {(field) => <Input {...field} {...register('pharmacyName')} autoComplete="organization" />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t('auth.join.ownerName')}
          error={errorText(formState.errors.ownerName?.message)}
        >
          {(field) => <Input {...field} {...register('ownerName')} autoComplete="name" />}
        </Field>
        <Field label={t('auth.join.city')} error={errorText(formState.errors.city?.message)}>
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
      </div>
      <Field
        label={t('auth.join.phone')}
        hint={t('auth.join.phoneHint')}
        error={errorText(formState.errors.phone?.message)}
      >
        {(field) => (
          <Input
            {...field}
            {...register('phone')}
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className="text-start"
          />
        )}
      </Field>
      <Field
        label={t('auth.join.license')}
        error={errorText(formState.errors.licenseNumber?.message)}
      >
        {(field) => (
          <Input {...field} {...register('licenseNumber')} dir="ltr" className="text-start" />
        )}
      </Field>
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 text-body">
          <input
            type="checkbox"
            {...register('terms')}
            aria-invalid={formState.errors.terms ? true : undefined}
            className="mt-1 size-4.5 accent-brand"
          />
          {t('auth.join.terms')}
        </label>
        {formState.errors.terms && (
          <p className="text-small text-danger">{errorText(formState.errors.terms.message)}</p>
        )}
      </div>
      {problem && (
        <p role="alert" className="rounded-md bg-danger-soft px-3.5 py-3 text-small text-danger">
          {problem}
        </p>
      )}
      <Button type="submit" size="lg" disabled={mutation.isPending}>
        {mutation.isPending ? t('auth.join.submitting') : t('auth.join.submit')}
      </Button>
    </form>
  )
}
