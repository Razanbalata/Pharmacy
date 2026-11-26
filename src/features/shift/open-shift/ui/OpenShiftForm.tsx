import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/entities/session'
import { openShift, shiftQueries } from '@/entities/shift'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Field, Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

/** Start of the day: count the cash in the drawer, then selling can start. */
export function OpenShiftForm({ onOpened }: { onOpened: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const { data: current } = useQuery(shiftQueries.current())
  const last = current?.lastClosingCash ?? null
  const [cash, setCash] = useState(last === null ? '' : String(last))
  const [error, setError] = useState<string | undefined>()
  const value = Number(cash)
  const differs = last !== null && cash !== '' && Number.isFinite(value) && value !== last

  const open = useMutation({
    mutationFn: () => openShift(value),
    onSuccess: async (shift) => {
      await queryClient.invalidateQueries({ queryKey: shiftQueries.all })
      toast.success(t('shift.opened', { number: shift.number }))
      onOpened()
    },
    onError: () => toast.error(t('shift.alreadyOpen')),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    if (cash.trim() === '' || !Number.isFinite(value) || value < 0) {
      setError(t('validation.required'))
      return
    }
    open.mutate()
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="open-shift"
      className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-surface-100 shadow-card p-6"
    >
      <div>
        <h1 id="open-shift" className="font-display text-title">
          {t('shift.openTitle')}
        </h1>
        <p className="mt-1 text-small text-ink-muted">{t('shift.openHint')}</p>
      </div>
      {user && 'pharmacy' in user && (
        <p className="flex justify-between rounded-md bg-surface-200 px-3 py-2 text-body">
          <span className="text-ink-muted">{t('shift.staff')}</span>
          <span>
            {user.name} · {t(`role.${user.role}`)}
          </span>
        </p>
      )}
      <Field
        label={t('shift.openingCash')}
        error={error}
        {...(last !== null ? { hint: t('shift.lastClosing', { amount: formatMoney(last) }) } : {})}
      >
        {(field) => (
          <span className="flex items-center gap-2">
            <Input
              {...field}
              value={cash}
              onChange={(event) => setCash(event.target.value)}
              inputMode="decimal"
              className="tabular w-40 text-title"
            />
            <span className="text-ink-muted">₪</span>
          </span>
        )}
      </Field>
      {differs && (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-warning">
          {t('shift.differsFromLast', { amount: formatMoney(Math.abs(roundMoney(value - last))) })}
        </p>
      )}
      <Button type="submit" size="lg" disabled={open.isPending}>
        {t('shift.open')}
      </Button>
    </form>
  )
}
