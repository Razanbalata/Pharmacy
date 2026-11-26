import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { toast } from '@/shared/ui/toast'
import { useMarkAllAlertsRead } from '../model/use-mark-read'

export function MarkAllReadButton({ disabled = false }: { disabled?: boolean }) {
  const { t } = useTranslation()
  const markAll = useMarkAllAlertsRead()
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={disabled || markAll.isPending}
      onClick={() =>
        markAll.mutate(undefined, { onSuccess: () => toast.success(t('alerts.marked')) })
      }
    >
      {t('alerts.markAll')}
    </Button>
  )
}
