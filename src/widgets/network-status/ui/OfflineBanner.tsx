import { useTranslation } from 'react-i18next'
import { outbox, useOnlineStatus, useOutboxCount } from '@/shared/lib/offline'

/** Shows only when there is no connection or work is still waiting to sync. */
export function OfflineBanner() {
  const { t } = useTranslation()
  const online = useOnlineStatus()
  const pending = useOutboxCount(outbox)

  if (online && pending === 0) return null

  return (
    // <output> is a live status region, so screen readers announce the change.
    <output className="flex items-center gap-3 bg-navy px-4 py-2 text-small text-on-navy">
      <span aria-hidden className="size-2.5 rounded-pill bg-warning" />
      <span className="flex-1">{online ? null : t('network.offline')}</span>
      {pending > 0 && <span className="tabular">{t('network.pending', { count: pending })}</span>}
    </output>
  )
}
