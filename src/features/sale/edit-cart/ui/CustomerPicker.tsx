import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/entities/cart'
import { customerQueries } from '@/entities/customer'
import { formatMoney } from '@/shared/lib/money'
import { formatPhone } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/field'

export const CUSTOMER_INPUT_ID = 'pos-customer'

/** Walk-in by default; a customer is needed to sell on credit. */
export function CustomerPicker() {
  const { t } = useTranslation()
  const customer = useCart((state) => state.customer)
  const setCustomer = useCart((state) => state.setCustomer)
  const [search, setSearch] = useState('')
  const deferred = useDeferredValue(search)
  const { data: found = [] } = useQuery({
    ...customerQueries.options(deferred),
    enabled: deferred.trim().length >= 2,
  })

  if (customer) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md bg-brand-soft px-3 py-2">
        <span className="flex flex-col">
          <span className="font-semibold text-brand-strong">{customer.name}</span>
          <span className="text-caption text-ink-muted">
            <bdi dir="ltr">{formatPhone(customer.phone)}</bdi> ·{' '}
            {t('pos.debt', {
              amount: formatMoney(customer.debt),
              limit: formatMoney(customer.debtLimit),
            })}
          </span>
        </span>
        <Button size="sm" variant="ghost" onClick={() => setCustomer(null)}>
          {t('pos.removeCustomer')}
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Input
        id={CUSTOMER_INPUT_ID}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={`${t('pos.walkIn')} · ${t('pos.customerHint')}`}
        aria-label={t('pos.customer')}
        autoComplete="off"
        className="h-9"
      />
      {deferred.trim().length >= 2 && found.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-border bg-surface-100 shadow-card">
          {found.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setCustomer(item)
                  setSearch('')
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start hover:bg-surface-200"
              >
                <span>{item.name}</span>
                <span className="tabular text-caption text-ink-muted">
                  {formatMoney(item.debt)} / {formatMoney(item.debtLimit)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
