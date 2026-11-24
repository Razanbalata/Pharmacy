import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cancelOrder, purchaseQueries, type PurchaseOrder } from '@/entities/purchase-order'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { toast } from '@/shared/ui/toast'

/** Only before anything arrived: after that, the order is closed by receiving. */
export function CancelOrderButton({ order }: { order: PurchaseOrder }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const nothingArrived = order.lines.every((line) => line.received === 0)
  const cancel = useMutation({
    mutationFn: () => cancelOrder(order.id),
    onSuccess: async () => {
      setOpen(false)
      await queryClient.invalidateQueries({ queryKey: purchaseQueries.all })
      toast.success(t('purchases.form.cancelled', { number: order.number }))
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  if (!(order.status === 'draft' || order.status === 'sent') || !nothingArrived) return null
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        {t('purchases.form.cancel')}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => cancel.mutate()}
        title={t('purchases.form.cancelTitle', { number: order.number })}
        message={t('purchases.form.cancelBody')}
        confirmLabel={t('purchases.form.cancel')}
        tone="danger"
        busy={cancel.isPending}
      />
    </>
  )
}
