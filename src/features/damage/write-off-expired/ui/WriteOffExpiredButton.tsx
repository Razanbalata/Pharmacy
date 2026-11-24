import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { damageQueries, recordExpired } from '@/entities/damage-record'
import { productQueries } from '@/entities/product'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { toast } from '@/shared/ui/toast'

/** Expired batches cannot be sold; this writes all of them off in one step. */
export function WriteOffExpiredButton() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const run = useMutation({
    mutationFn: recordExpired,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: damageQueries.all })
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      toast.success(
        t('damage.recordedExpired', { count: result.count, amount: formatMoney(result.loss) }),
      )
    },
    onError: () => toast.error(t('validation.serverError')),
  })
  return (
    <Button size="sm" variant="secondary" disabled={run.isPending} onClick={() => run.mutate()}>
      {t('damage.recordExpired')}
    </Button>
  )
}
