import { useTranslation } from 'react-i18next'
import {
  cartTotals,
  lineBase,
  linePrice,
  maxQuantity,
  useCart,
  type CartLine,
} from '@/entities/cart'
import { cn } from '@/shared/lib/cn'
import { formatMonthYear } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { CustomerPicker } from './CustomerPicker'

interface CartPanelProps {
  onPay: () => void
  onHold: () => void
  onDiscount: () => void
  /** Adds a customer not on the list yet, starting from the name typed. */
  onAddCustomer?: (name: string) => void
}

function Line({ line, selected }: { line: CartLine; selected: boolean }) {
  const { t } = useTranslation()
  const { setQuantity, setUnit, remove, select } = useCart()
  const max = maxQuantity(line)
  const left = Math.floor((line.stock - lineBase(line)) * 100) / 100
  const unit = line.units[line.unitIndex]
  const enabled = line.units
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.enabled)

  return (
    <li
      className={cn(
        'flex flex-col gap-2 border-b border-border px-3 py-3 last:border-0',
        selected && 'bg-brand-soft/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => select(line.productId)} className="min-w-0 text-start">
          <bdi className="block font-semibold">{line.name}</bdi>
          <span className="text-caption text-ink-muted">
            {t('pos.batchLine', { batch: line.batch, expiry: formatMonthYear(line.expiry) })}
          </span>
        </button>
        <span className="tabular font-semibold">{formatMoney(linePrice(line))} ₪</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {enabled.length > 1 ? (
          <Segmented
            label={t('pos.unitOf', { name: line.name })}
            value={String(line.unitIndex)}
            onChange={(value) => setUnit(line.productId, Number(value))}
            options={enabled.map((item) => ({ value: String(item.index), label: item.name }))}
          />
        ) : (
          <span className="text-small text-ink-muted">{unit?.name}</span>
        )}
        <span className="flex items-center gap-1">
          <Button
            size="sm"
            variant="secondary"
            aria-label={t('pos.decrease', { name: line.name })}
            disabled={line.quantity <= 1}
            onClick={() => setQuantity(line.productId, line.quantity - 1)}
          >
            −
          </Button>
          <Input
            aria-label={t('pos.quantityOf', { name: line.name })}
            value={line.quantity}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isFinite(value)) setQuantity(line.productId, Math.min(value, max))
            }}
            inputMode="numeric"
            className="tabular h-8 w-12 text-center"
          />
          <Button
            size="sm"
            variant="secondary"
            aria-label={t('pos.increase', { name: line.name })}
            disabled={line.quantity >= max}
            onClick={() => setQuantity(line.productId, line.quantity + 1)}
          >
            +
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label={t('pos.remove', { name: line.name })}
            onClick={() => remove(line.productId)}
          >
            ✕
          </Button>
        </span>
      </div>
      {line.quantity >= max ? (
        <p className="text-caption text-warning">
          {t('pos.noMore', { count: max, unit: unit?.name ?? '' })}
        </p>
      ) : left <= line.minStock ? (
        <p className="text-caption text-warning">
          {t('pos.lowAfter', { count: left, unit: line.units[0]?.name ?? '', min: line.minStock })}
        </p>
      ) : null}
    </li>
  )
}

/** The sale being made: customer, lines, totals, and what to do with it. */
export function CartPanel({ onPay, onHold, onDiscount, onAddCustomer }: CartPanelProps) {
  const { t } = useTranslation()
  const { lines, discount, selected, label, clear, setDiscount } = useCart()
  const totals = cartTotals(lines, discount)

  return (
    <section
      aria-label={t('pos.cart')}
      className="flex min-h-0 flex-col rounded-lg border border-border bg-surface-100 shadow-card"
    >
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <p className="flex items-center justify-between">
          <span className="font-display text-body-strong">{t('pos.cart')}</span>
          <span className="text-small text-ink-muted">{label}</span>
        </p>
        <CustomerPicker {...(onAddCustomer ? { onAddNew: onAddCustomer } : {})} />
      </div>

      {lines.length === 0 ? (
        <p className="grow p-6 text-center text-small text-ink-muted">{t('pos.emptyCart')}</p>
      ) : (
        <ul className="min-h-0 grow overflow-y-auto">
          {lines.map((line) => (
            <Line key={line.productId} line={line} selected={line.productId === selected} />
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 border-t border-border p-3">
        <p className="flex justify-between text-small text-ink-muted">
          <span>{t('pos.subtotal', { lines: lines.length, pieces: totals.pieces })}</span>
          <span className="tabular">{formatMoney(totals.subtotal)} ₪</span>
        </p>
        {totals.discount > 0 && (
          <p className="flex justify-between text-small text-success">
            <button type="button" onClick={() => setDiscount(0)} className="hover:underline">
              {t('pos.discount')} ✕
            </button>
            <bdi dir="ltr" className="tabular">
              − {formatMoney(totals.discount)} ₪
            </bdi>
          </p>
        )}
        <p className="flex items-baseline justify-between">
          <span className="font-semibold">{t('pos.total')}</span>
          <span className="tabular font-display text-display">{formatMoney(totals.total)} ₪</span>
        </p>
        <Button size="lg" disabled={lines.length === 0} onClick={onPay}>
          {t('pos.pay')} <kbd className="text-caption opacity-80">F12</kbd>
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="secondary" disabled={lines.length === 0} onClick={onHold}>
            {t('pos.hold')}
          </Button>
          <Button size="sm" variant="secondary" disabled={lines.length === 0} onClick={onDiscount}>
            {t('pos.addDiscount')}
          </Button>
          <Button size="sm" variant="ghost" disabled={lines.length === 0} onClick={() => clear()}>
            {t('pos.cancel')}
          </Button>
        </div>
      </div>
    </section>
  )
}
