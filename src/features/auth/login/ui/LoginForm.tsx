import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { landingPathFor, login, sessionQueries } from '@/entities/session'
import { ApiError, fetchCsrfCookie } from '@/shared/api'
import { paths } from '@/shared/config'
import { useErrorText } from '@/shared/lib/forms'
import { Button } from '@/shared/ui/button'
import { Field, Input, PasswordInput } from '@/shared/ui/field'
import { loginSchema, type LoginValues } from '../model/schema'

/** Phone or email + password. Lands each role on its own first screen. */
export function LoginForm() {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [problem, setProblem] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '', remember: true },
  })

  const mutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      await fetchCsrfCookie()
      return login(values)
    },
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueries.me().queryKey, user)
      void navigate(landingPathFor(user), { replace: true })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isRateLimited) {
        const minutes = Number(error.body['retryAfterMinutes'] ?? 15)
        setProblem(t('auth.login.locked', { minutes }))
      } else if (error instanceof ApiError && error.isValidation) {
        const left = Number(error.body['attemptsLeft'] ?? 0)
        setProblem(
          `${t('auth.login.wrong')}${left > 0 && left <= 3 ? ` ${t('auth.login.attemptsLeft', { count: left })}` : ''}`,
        )
      } else {
        setProblem(
          t(
            error instanceof ApiError && error.isNetwork
              ? 'validation.offline'
              : 'validation.serverError',
          ),
        )
      }
    },
  })

  const { register, handleSubmit, formState } = form

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => {
        setProblem(null)
        mutation.mutate(values)
      })}
      className="flex flex-col gap-4"
    >
      <Field label={t('auth.login.login')} error={errorText(formState.errors.login?.message)}>
        {(control) => (
          <Input
            {...control}
            {...register('login')}
            autoComplete="username"
            dir="ltr"
            className="text-start"
          />
        )}
      </Field>
      <div className="flex flex-col gap-1.5">
        <Field
          label={t('auth.login.password')}
          error={errorText(formState.errors.password?.message)}
        >
          {(control) => (
            <PasswordInput {...control} {...register('password')} autoComplete="current-password" />
          )}
        </Field>
        <Link
          to={paths.forgotPassword}
          className="self-end text-small text-brand-strong hover:underline"
        >
          {t('auth.login.forgot')}
        </Link>
      </div>
      <label className="flex items-center gap-2 text-body">
        <input type="checkbox" {...register('remember')} className="size-4.5 accent-brand" />
        {t('auth.login.remember')}
      </label>
      {problem && (
        <p role="alert" className="rounded-md bg-danger-soft px-3.5 py-3 text-small text-danger">
          {problem}
        </p>
      )}
      <Button type="submit" size="lg" disabled={mutation.isPending}>
        {mutation.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>
    </form>
  )
}
