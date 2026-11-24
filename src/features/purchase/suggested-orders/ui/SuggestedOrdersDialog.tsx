import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createSuggestedDrafts, purchaseQueries } from '@/entities/purchase-order'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { toast } from '@/shared/ui/toast'

interface SuggestedOrdersDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Products below their minimum, grouped by usual supplier. Each ticked supplier becomes
 * a draft order to check and send.
 */
export function SuggestedOrdersDialog({ open, onClose }: SuggestedOrdersDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: groups = [] } = useQuery({ ...purchaseQueries.suggestions(), enabled: open })
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const picked = groups.filter((group) => !skipped.has(group.supplier.id))

  const create = useMutation({
    mutationFn: () => createSuggestedDrafts(picked.map((group) => group.supplier.id)),
    onSuccess: async (drafts) => {
      await queryClient.invalidateQueries({ queryKey: purchaseQueries.all })
      toast.success(t('purchases.suggested.created', { count: drafts.length }))
      onClose()
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('purchases.suggested.title')}
      description={t('purchases.suggested.hint')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={picked.length === 0 || create.isPending}
            onClick={() => create.mutate()}
          >
            {t('purchases.suggested.create', { count: picked.length })}
          </Button>
        </>
      }
    >
      {groups.length === 0 ? (
        <p className="text-small text-ink-muted">{t('purchases.suggested.none')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => {
            const total = roundMoney(
              group.lines.reduce((sum, line) => sum + line.quantity * line.cost, 0),
            )
            return (
              <li key={group.supplier.id} className="rounded-md border border-border p-3">
                <label className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={!skipped.has(group.supplier.id)}
                      onChange={(event) => {
                        const next = new Set(skipped)
                        if (event.target.checked) next.delete(group.supplier.id)
                        else next.add(group.supplier.id)
                        setSkipped(next)
                      }}
                      aria-label={t('purchases.suggested.pick', { name: group.supplier.name })}
                      className="size-4 accent-brand"
                    />
                    {group.supplier.name}
                  </span>
                  <span className="tabular text-small text-ink-muted">
                    {t('purchases.suggested.lines', { count: group.lines.length })} ·{' '}
                    {formatMoney(total)} ₪
                  </span>
                </label>
                <ul className="mt-2 flex flex-col gap-1 ps-6 text-small text-ink-muted">
                  {group.lines.map((line) => (
                    <li key={line.productId} className="flex justify-between gap-2">
                      <bdi>{line.name}</bdi>
                      <span className="tabular">
                        {line.stock} → +{line.quantity} {line.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      )}
    </Dialog>
  )
}
