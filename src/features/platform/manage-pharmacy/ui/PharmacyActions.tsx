import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  changePlan,
  extendTrial,
  platformPharmacyQueries,
  requestSupportAccess,
  resumePharmacy,
  suspendPharmacy,
  type PharmacyDetail,
} from '@/entities/platform/pharmacy'
import { subscriptionQueries, type PaidPlan } from '@/entities/platform/subscription'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog, Dialog } from '@/shared/ui/dialog'
import { Field, Input, Textarea } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { toast } from '@/shared/ui/toast'

type Open = 'extend' | 'plan' | 'support' | 'suspend' | 'resume' | null

const PAID: PaidPlan[] = ['basic', 'pro', 'yearly']

/**
 * What the platform owner can do to a pharmacy. Nothing here reads or changes the pharmacy's own
 * data: support access waits for the owner's permission.
 */
export function PharmacyActions({
  pharmacy,
  open,
  onOpen,
}: {
  pharmacy: PharmacyDetail
  /** Lets the page open "change plan" from its own button. */
  open: Open
  onOpen: (open: Open) => void
}) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [days, setDays] = useState<'7' | '14'>('7')
  const [plan, setPlan] = useState<PaidPlan>('basic')
  const [months, setMonths] = useState('1')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | undefined>()
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })

  const close = () => {
    onOpen(null)
    setError(undefined)
    setReason('')
  }
  const act = useMutation({
    mutationFn: async (kind: Exclude<Open, null>) => {
      if (kind === 'extend') return extendTrial(pharmacy.id, days === '7' ? 7 : 14)
      if (kind === 'plan') return changePlan(pharmacy.id, plan, Number(months))
      if (kind === 'support') return requestSupportAccess(pharmacy.id)
      if (kind === 'suspend') return suspendPharmacy(pharmacy.id, reason.trim())
      return resumePharmacy(pharmacy.id)
    },
    onSuccess: async (saved, kind) => {
      await queryClient.invalidateQueries({ queryKey: platformPharmacyQueries.all })
      await queryClient.invalidateQueries({ queryKey: subscriptionQueries.all })
      const messages = {
        extend: t('tenant.extended', { count: Number(days) }),
        plan: t('tenant.planSaved', {
          plan: t(`tenants.plans.${saved.plan}`),
          date: date.format(new Date(saved.endsAt)),
        }),
        support: t('tenant.supportRequested'),
        suspend: t('tenant.suspended', { name: saved.name }),
        resume: t('tenant.resumed', { name: saved.name }),
      }
      toast.success(messages[kind])
      close()
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  const items = [
    ...(pharmacy.plan === 'trial'
      ? [{ key: 'extend' as const, label: t('tenant.extend'), hint: t('tenant.extendHint') }]
      : []),
    { key: 'plan' as const, label: t('tenant.changePlan'), hint: t('tenant.changePlanHint') },
    {
      key: 'support' as const,
      label: t('tenant.support'),
      hint:
        pharmacy.supportAccess === 'requested'
          ? t('tenant.supportPending')
          : t('tenant.supportHint'),
      disabled: pharmacy.supportAccess === 'requested',
    },
    pharmacy.status === 'active'
      ? {
          key: 'suspend' as const,
          label: t('tenant.suspend'),
          hint: t('tenant.suspendHint'),
          danger: true,
        }
      : { key: 'resume' as const, label: t('tenant.resume'), hint: '' },
  ]

  return (
    <>
      <ul className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              disabled={'disabled' in item && item.disabled}
              onClick={() => onOpen(item.key)}
              className="flex w-full flex-col items-start gap-0.5 px-1 py-2.5 text-start hover:bg-surface-200 disabled:opacity-60"
            >
              <span
                className={
                  'danger' in item && item.danger ? 'font-semibold text-danger' : 'font-semibold'
                }
              >
                {item.label}
              </span>
              {item.hint && <span className="text-caption text-ink-muted">{item.hint}</span>}
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={open === 'extend'}
        onClose={close}
        title={t('tenant.extend')}
        footer={
          <>
            <Button onClick={() => act.mutate('extend')} disabled={act.isPending}>
              {t('common.confirm')}
            </Button>
            <Button variant="ghost" onClick={close}>
              {t('common.cancel')}
            </Button>
          </>
        }
      >
        <Segmented<'7' | '14'>
          label={t('tenant.extend')}
          value={days}
          onChange={setDays}
          options={(['7', '14'] as const).map((value) => ({
            value,
            label: t('tenant.extendDays', { count: Number(value) }),
          }))}
        />
      </Dialog>

      <Dialog
        open={open === 'plan'}
        onClose={close}
        title={t('tenant.changePlan')}
        description={t('tenant.changePlanHint')}
        footer={
          <>
            <Button onClick={() => act.mutate('plan')} disabled={act.isPending}>
              {t('tenant.savePlan')}
            </Button>
            <Button variant="ghost" onClick={close}>
              {t('common.cancel')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Segmented<PaidPlan>
            label={t('tenant.plan')}
            value={plan}
            onChange={(value) => {
              setPlan(value)
              setMonths(value === 'yearly' ? '12' : '1')
            }}
            options={PAID.map((value) => ({ value, label: t(`tenants.plans.${value}`) }))}
          />
          <Field label={t('tenant.months')}>
            {(field) => (
              <Input
                {...field}
                value={months}
                onChange={(event) => setMonths(event.target.value)}
                inputMode="numeric"
                className="tabular w-24"
              />
            )}
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={open === 'support'}
        onClose={close}
        onConfirm={() => act.mutate('support')}
        busy={act.isPending}
        title={t('tenant.support')}
        message={t('tenant.supportHint')}
      />

      <Dialog
        open={open === 'suspend'}
        onClose={close}
        title={t('tenant.suspend')}
        description={t('tenant.suspendHint')}
        footer={
          <>
            <Button
              variant="danger"
              disabled={act.isPending}
              onClick={() => {
                if (!reason.trim()) setError(t('tenant.reasonRequired'))
                else act.mutate('suspend')
              }}
            >
              {t('tenant.suspendConfirm')}
            </Button>
            <Button variant="ghost" onClick={close}>
              {t('common.cancel')}
            </Button>
          </>
        }
      >
        <Field label={t('tenant.suspendReason')} hint={t('tenant.suspendReasonHint')} error={error}>
          {(field) => (
            <Textarea
              {...field}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
            />
          )}
        </Field>
      </Dialog>

      <ConfirmDialog
        open={open === 'resume'}
        onClose={close}
        onConfirm={() => act.mutate('resume')}
        busy={act.isPending}
        title={t('tenant.resume')}
        message={pharmacy.name}
      />
    </>
  )
}
