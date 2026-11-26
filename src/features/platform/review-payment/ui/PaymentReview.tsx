import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { platformPharmacyQueries } from '@/entities/platform/pharmacy'
import {
  confirmPayment,
  rejectPayment,
  subscriptionQueries,
  type SubscriptionPayment,
} from '@/entities/platform/subscription'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Textarea } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

/** Confirm a pending payment (the plan starts), or reject it with a reason the pharmacy sees. */
export function PaymentReview({ payment }: { payment: SubscriptionPayment }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | undefined>()
  const name = payment.pharmacy.name
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: subscriptionQueries.all })
    await queryClient.invalidateQueries({ queryKey: platformPharmacyQueries.all })
  }

  const confirm = useMutation({
    mutationFn: () => confirmPayment(payment.id),
    onSuccess: async () => {
      await refresh()
      toast.success(t('billing.confirmed', { name }))
    },
    onError: () => toast.error(t('validation.serverError')),
  })
  const reject = useMutation({
    mutationFn: () => rejectPayment(payment.id, reason.trim()),
    onSuccess: async () => {
      await refresh()
      toast.success(t('billing.rejected', { name }))
      setRejecting(false)
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  return (
    <span className="flex justify-end gap-1">
      <Button
        size="sm"
        disabled={confirm.isPending}
        aria-label={`${t('billing.confirm')}: ${name}`}
        onClick={() => confirm.mutate()}
      >
        {t('billing.confirm')}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`${t('billing.reject')}: ${name}`}
        onClick={() => setRejecting(true)}
      >
        {t('billing.reject')}
      </Button>
      <Dialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title={t('billing.rejectTitle', { name })}
        footer={
          <>
            <Button
              variant="danger"
              disabled={reject.isPending}
              onClick={() => {
                if (!reason.trim()) setError(t('tenant.reasonRequired'))
                else reject.mutate()
              }}
            >
              {t('billing.reject')}
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              {t('common.cancel')}
            </Button>
          </>
        }
      >
        <Field label={t('billing.rejectReason')} hint={t('billing.rejectReasonHint')} error={error}>
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
    </span>
  )
}
