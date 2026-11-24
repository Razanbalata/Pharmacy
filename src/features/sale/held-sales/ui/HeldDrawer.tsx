import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Drawer } from '@/shared/ui/dialog'
import { useHeldSales } from '../model/use-held'

function useAgo() {
  const { t } = useTranslation()
  return (iso: string) => {
    const minutes = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000))
    return minutes < 60
      ? t('held.ago', { minutes })
      : t('held.agoHours', { hours: Math.round(minutes / 60) })
  }
}

/** Every held sale in the shift, to resume or cancel. */
export function HeldDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const ago = useAgo()
  const { held, resume, cancel } = useHeldSales()

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('held.title')}
      description={t('held.subtitle', { count: held.length })}
      footer={<p className="text-small text-ink-muted">{t('held.note')}</p>}
    >
      {held.length === 0 ? (
        <p className="text-small text-ink-muted">{t('held.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {held.map((sale) => (
            <li key={sale.id} className="rounded-lg border border-border p-3">
              <p className="flex items-baseline justify-between">
                <span className="font-semibold">{sale.label}</span>
                <span className="tabular font-display text-body-strong">
                  {formatMoney(sale.total)} ₪
                </span>
              </p>
              <p className="text-small text-ink-muted">
                {ago(sale.at)} · {sale.cashier}
                {sale.customer && ` · ${t('held.customer', { name: sale.customer.name })}`}
              </p>
              <p className="mt-1 text-small">
                <bdi>{sale.lines.map((line) => line.name).join(' · ')}</bdi>
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    void resume(sale).then((done) => {
                      if (done) onClose()
                    })
                  }
                >
                  {t('held.resume')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void cancel(sale)}>
                  {t('held.cancel')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}
