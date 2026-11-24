import { useTranslation } from 'react-i18next'
import { useCart } from '@/entities/cart'
import { cn } from '@/shared/lib/cn'
import { useHeldSales } from '../model/use-held'

/** The current sale and the held ones side by side, like browser tabs, and "new sale". */
export function HeldTabs() {
  const { t } = useTranslation()
  const label = useCart((state) => state.label)
  const { held, hold, resume } = useHeldSales()

  return (
    <nav aria-label={t('pos.tabs')} className="flex flex-wrap items-center gap-1.5">
      <span
        aria-current="page"
        className="rounded-md bg-surface-100 px-3 py-1.5 text-small font-semibold text-ink"
      >
        {label} · {t('pos.current')}
      </span>
      {held.map((sale) => (
        <button
          key={sale.id}
          type="button"
          onClick={() => void resume(sale)}
          className={cn(
            'rounded-md border border-on-navy/30 px-3 py-1.5 text-small hover:bg-navy-soft',
          )}
        >
          {t('pos.heldTab', { label: sale.label, count: sale.lines.length })}
        </button>
      ))}
      <button
        type="button"
        onClick={() => void hold()}
        className="rounded-md px-3 py-1.5 text-small underline-offset-4 hover:underline"
      >
        + {t('pos.newSale')} <kbd className="text-caption opacity-70">F4</kbd>
      </button>
    </nav>
  )
}
