import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { activateAccount, type ActivationInfo } from '@/entities/platform/join-request'
import { sessionQueries } from '@/entities/session'
import { fetchCsrfCookie } from '@/shared/api'
import { paths } from '@/shared/config'
import { useErrorText } from '@/shared/lib/forms'
import { formatPhone } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Field, Input, PasswordInput } from '@/shared/ui/field'
import { activateSchema, type ActivateValues } from '../model/schema'

/** The owner picks her own password; then she is signed in and goes to set up the pharmacy. */
export function ActivateForm({ token, info }: { token: string; info: ActivationInfo }) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<ActivateValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: { email: '', password: '', confirm: '' },
  })
  const mutation = useMutation({
    mutationFn: async ({ password, email }: ActivateValues) => {
      await fetchCsrfCookie()
      await activateAccount(token, email ? { password, email } : { password })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueries.all })
      void navigate(paths.setup, { replace: true })
    },
  })
  const { register, handleSubmit, formState } = form

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="flex flex-col gap-4"
    >
      <Field label={t('auth.activate.phone')}>
        {(field) => (
          <Input
            {...field}
            value={formatPhone(info.phone)}
            disabled
            readOnly
            dir="ltr"
            className="tabular text-start"
          />
        )}
      </Field>
      <Field
        label={t('auth.activate.email')}
        hint={t('auth.activate.emailHint')}
        optional
        error={errorText(formState.errors.email?.message)}
      >
        {(field) => (
          <Input
            {...field}
            {...register('email')}
            type="email"
            autoComplete="email"
            dir="ltr"
            className="text-start"
          />
        )}
      </Field>
      <Field
        label={t('auth.activate.password')}
        hint={t('password.rule')}
        error={errorText(formState.errors.password?.message)}
      >
        {(field) => (
          <PasswordInput
            {...field}
            {...register('password')}
            autoComplete="new-password"
            showStrength
          />
        )}
      </Field>
      <Field
        label={t('auth.activate.confirm')}
        error={errorText(formState.errors.confirm?.message)}
      >
        {(field) => (
          <PasswordInput {...field} {...register('confirm')} autoComplete="new-password" />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={mutation.isPending}>
        {mutation.isPending ? t('auth.activate.submitting') : t('auth.activate.submit')}
      </Button>
      <p className="text-center text-small text-ink-muted">{t('auth.activate.trialNote')}</p>
    </form>
  )
}
