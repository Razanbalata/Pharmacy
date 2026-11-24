import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cartTotals, useCart } from '@/entities/cart'
import { useCurrentUser } from '@/entities/session'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'

/** A discount on the whole sale, within the seller's limit set by the manager. */
export function DiscountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  const { lines, discount, setDiscount } = useCart()
  const { subtotal } = cartTotals(lines, 0)
  const [mode, setMode] = useState<'amount' | 'percent'>('amount')
  const [value, setValue] = useState(discount > 0 ? String(discount) : '')
  const limit = user && 'pharmacy' in user ? user.discountLimit : 0
  const number = Number(value) || 0
  const amount = roundMoney(mode === 'percent' ? (subtotal * number) / 100 : number)
  const over = limit !== null && amount > (subtotal * limit) / 100 + 1e-9

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('pos.discountTitle')}
      {...(limit !== null ? { description: t('pos.discountLimit', { limit }) } : {})}
      footer={
        <>
          {discount > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setDiscount(0)
                onClose()
              }}
            >
              {t('pos.discountRemove')}
            </Button>
          )}
          <Button
            disabled={over || amount <= 0 || amount > subtotal}
            onClick={() => {
              setDiscount(amount)
              onClose()
            }}
          >
            {t('pos.discountApply')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Segmented<'amount' | 'percent'>
          label={t('pos.discountAmount')}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'amount', label: `${t('pos.discountByAmount')} ₪` },
            { value: 'percent', label: `${t('pos.discountByPercent')} %` },
          ]}
        />
        <Field label={t('pos.discountAmount')} error={over ? t('pos.discountOver') : undefined}>
          {(field) => (
            <Input
              {...field}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              inputMode="decimal"
              className="tabular w-36 text-title"
            />
          )}
        </Field>
        {mode === 'percent' && number > 0 && (
          <p className="tabular text-small text-ink-muted">= {formatMoney(amount)} ₪</p>
        )}
      </div>
    </Dialog>
  )
}
