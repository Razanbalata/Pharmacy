import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { requestResetCode, resetPassword, verifyResetCode } from '@/entities/session'
import { paths } from '@/shared/config'
import { applyServerErrors, useErrorText } from '@/shared/lib/forms'
import { isAcceptablePassword } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Field, Input, PasswordInput } from '@/shared/ui/field'
import { Steps } from '@/shared/ui/steps'
import { toast } from '@/shared/ui/toast'

const phoneSchema = z.object({
  login: z.string().trim().min(1, 'validation.required'),
  channel: z.enum(['whatsapp', 'sms']),
})
const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'validation.code') })
const passwordSchema = z
  .object({
    password: z.string().refine(isAcceptablePassword, 'validation.password'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'validation.passwordsDiffer',
    path: ['confirm'],
  })

type Stage =
  | { name: 'phone' }
  | { name: 'code'; login: string; last: string; resendAt: number }
  | { name: 'password'; resetToken: string }

function useSecondsLeft(until: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return Math.max(0, Math.ceil((until - now) / 1000))
}

function PhoneStep({ onSent }: { onSent: (login: string, last: string, wait: number) => void }) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const form = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { login: '', channel: 'whatsapp' },
  })
  const mutation = useMutation({
    mutationFn: requestResetCode,
    onSuccess: (sent, values) => onSent(values.login, sent.last, sent.resendInSeconds),
  })
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="flex flex-col gap-4"
    >
      <h2 className="font-display text-subheading">{t('auth.forgot.stepPhone')}</h2>
      <Field label={t('auth.forgot.login')} error={errorText(form.formState.errors.login?.message)}>
        {(control) => (
          <Input {...control} {...form.register('login')} dir="ltr" className="text-start" />
        )}
      </Field>
      <fieldset className="flex gap-5 text-body">
        <legend className="mb-2 text-small font-semibold">{t('auth.forgot.channel')}</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="whatsapp"
            {...form.register('channel')}
            className="accent-brand"
          />
          {t('auth.forgot.whatsapp')}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="sms" {...form.register('channel')} className="accent-brand" />
          {t('auth.forgot.sms')}
        </label>
      </fieldset>
      <Button type="submit" size="lg" disabled={mutation.isPending}>
        {t('auth.forgot.send')}
      </Button>
      <p className="text-small text-ink-muted">{t('auth.forgot.staffNote')}</p>
    </form>
  )
}

function CodeStep({
  stage,
  onVerified,
  onResent,
}: {
  stage: Extract<Stage, { name: 'code' }>
  onVerified: (token: string) => void
  onResent: (wait: number) => void
}) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const secondsLeft = useSecondsLeft(stage.resendAt)
  const form = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  })
  const verify = useMutation({
    mutationFn: (code: string) => verifyResetCode({ login: stage.login, code }),
    onSuccess: onVerified,
    onError: (error) => {
      applyServerErrors(error, form.setError, { invalid: 'auth.forgot.wrongCode' })
    },
  })
  const resend = useMutation({
    mutationFn: () => requestResetCode({ login: stage.login, channel: 'whatsapp' }),
    onSuccess: (sent) => onResent(sent.resendInSeconds),
  })
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => verify.mutate(values.code))}
      className="flex flex-col gap-4"
    >
      <h2 className="font-display text-subheading">{t('auth.forgot.stepCode')}</h2>
      <p className="text-body text-ink-muted">{t('auth.forgot.sentTo', { last: stage.last })}</p>
      <Field label={t('auth.forgot.code')} error={errorText(form.formState.errors.code?.message)}>
        {(control) => (
          <Input
            {...control}
            {...form.register('code')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            dir="ltr"
            className="tabular text-center text-heading tracking-[0.5em]"
          />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={verify.isPending}>
        {t('auth.forgot.verify')}
      </Button>
      {secondsLeft > 0 ? (
        <p className="text-center text-small text-ink-muted">
          {t('auth.forgot.resendIn', { seconds: secondsLeft })}
        </p>
      ) : (
        <Button variant="ghost" onClick={() => resend.mutate()} disabled={resend.isPending}>
          {t('auth.forgot.resend')}
        </Button>
      )}
    </form>
  )
}

function PasswordStep({ resetToken }: { resetToken: string }) {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  })
  const mutation = useMutation({
    mutationFn: (password: string) => resetPassword({ resetToken, password }),
    onSuccess: () => {
      toast.success(t('auth.forgot.saved'))
      void navigate(paths.login, { replace: true })
    },
  })
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => mutation.mutate(values.password))}
      className="flex flex-col gap-4"
    >
      <h2 className="font-display text-subheading">{t('auth.forgot.stepPassword')}</h2>
      <Field
        label={t('auth.forgot.newPassword')}
        hint={t('password.rule')}
        error={errorText(form.formState.errors.password?.message)}
      >
        {(control) => (
          <PasswordInput
            {...control}
            {...form.register('password')}
            autoComplete="new-password"
            showStrength
          />
        )}
      </Field>
      <Field
        label={t('auth.forgot.confirm')}
        error={errorText(form.formState.errors.confirm?.message)}
      >
        {(control) => (
          <PasswordInput {...control} {...form.register('confirm')} autoComplete="new-password" />
        )}
      </Field>
      <p className="rounded-md bg-success-soft px-3.5 py-2.5 text-small text-success">
        {t('auth.forgot.signedOutEverywhere')}
      </p>
      <Button type="submit" size="lg" disabled={mutation.isPending}>
        {t('auth.forgot.save')}
      </Button>
    </form>
  )
}

/** Three steps on one screen: where to send the code, the code, the new password. */
export function ResetPasswordFlow() {
  const { t } = useTranslation()
  const [stage, setStage] = useState<Stage>({ name: 'phone' })
  const index = { phone: 0, code: 1, password: 2 }[stage.name]

  return (
    <div className="flex flex-col gap-6">
      <Steps
        current={index}
        steps={[t('auth.forgot.login'), t('auth.forgot.code'), t('auth.forgot.stepPassword')]}
      />
      {stage.name === 'phone' && (
        <PhoneStep
          onSent={(login, last, wait) =>
            setStage({ name: 'code', login, last, resendAt: Date.now() + wait * 1000 })
          }
        />
      )}
      {stage.name === 'code' && (
        <CodeStep
          stage={stage}
          onVerified={(resetToken) => setStage({ name: 'password', resetToken })}
          onResent={(wait) => setStage({ ...stage, resendAt: Date.now() + wait * 1000 })}
        />
      )}
      {stage.name === 'password' && <PasswordStep resetToken={stage.resetToken} />}
    </div>
  )
}
