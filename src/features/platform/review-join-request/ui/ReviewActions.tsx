import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  approveJoinRequest,
  joinRequestQueries,
  rejectJoinRequest,
  type JoinRequest,
} from '@/entities/join-request'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Textarea } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

/** Approve (sends the activation link) or reject with a reason that goes to the owner. */
export function ReviewActions({ request }: { request: JoinRequest }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const refresh = () => queryClient.invalidateQueries({ queryKey: joinRequestQueries.all })

  const approve = useMutation({
    mutationFn: () => approveJoinRequest(request.id),
    onSuccess: async () => {
      toast.success(t('platform.requests.approved', { pharmacy: request.pharmacyName }))
      await refresh()
    },
  })
  const reject = useMutation({
    mutationFn: () => rejectJoinRequest(request.id, reason.trim()),
    onSuccess: async () => {
      setRejecting(false)
      setReason('')
      toast.info(t('platform.requests.rejected', { pharmacy: request.pharmacyName }))
      await refresh()
    },
  })

  if (request.status !== 'new') return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          className="flex-1 bg-success hover:bg-success/90"
          onClick={() => approve.mutate()}
          disabled={approve.isPending}
        >
          {t('platform.requests.approve')}
        </Button>
        <a
          href={`tel:${request.phone}`}
          className="flex h-10 items-center rounded-md border border-border-strong px-4 text-body hover:bg-surface-200"
        >
          {t('platform.requests.call')}
        </a>
        <Button
          variant="secondary"
          className="border-danger text-danger"
          onClick={() => setRejecting(true)}
        >
          {t('platform.requests.reject')}
        </Button>
      </div>
      <Dialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title={t('platform.requests.rejectTitle', { pharmacy: request.pharmacyName })}
        footer={
          <>
            <Button
              variant="danger"
              onClick={() => reject.mutate()}
              disabled={!reason.trim() || reject.isPending}
            >
              {t('platform.requests.rejectConfirm')}
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              {t('common.back')}
            </Button>
          </>
        }
      >
        <Field label={t('platform.requests.rejectReason')} hint={t('platform.requests.rejectHint')}>
          {(field) => (
            <Textarea
              {...field}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          )}
        </Field>
      </Dialog>
    </>
  )
}
