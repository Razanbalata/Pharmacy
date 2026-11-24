import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { useCart } from '@/entities/cart'
import type { Invoice } from '@/entities/invoice'
import { shiftQueries } from '@/entities/shift'
import { PaymentDialog, ReceiptDialog } from '@/features/sale/checkout'
import { DiscountDialog } from '@/features/sale/discount'
import { CUSTOMER_INPUT_ID, CartPanel } from '@/features/sale/edit-cart'
import { ProductSearch, SEARCH_INPUT_ID } from '@/features/sale/find-product'
import { HeldDrawer, HeldTabs, useHeldSales } from '@/features/sale/held-sales'
import { TillHeader } from '@/widgets/till-header'
import { paths } from '@/shared/config'
import { Button, buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { PageSkeleton } from '@/shared/ui/skeleton'

type Open = 'pay' | 'discount' | 'held' | null

const SHORTCUTS = [
  ['F2', 'search'],
  ['F4', 'hold'],
  ['F6', 'customer'],
  ['F8', 'discount'],
  ['F12', 'pay'],
  ['Esc', 'clear'],
  ['Del', 'remove'],
] as const

/** The till: search on one side, the sale on the other, everything on the keyboard. */
export function PosPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState<Open>(params.get('held') === '1' ? 'held' : null)
  const [receipt, setReceipt] = useState<Invoice | null>(null)
  const { data: current, isPending } = useQuery(shiftQueries.current())
  const { hold } = useHeldSales()

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const { lines, selected, remove } = useCart.getState()
      const typing = event.target instanceof HTMLInputElement && event.target.id !== SEARCH_INPUT_ID
      if (event.key === 'F2') {
        event.preventDefault()
        document.getElementById(SEARCH_INPUT_ID)?.focus()
      } else if (event.key === 'F4') {
        event.preventDefault()
        void hold()
      } else if (event.key === 'F6') {
        event.preventDefault()
        document.getElementById(CUSTOMER_INPUT_ID)?.focus()
      } else if (event.key === 'F8' && lines.length > 0) {
        event.preventDefault()
        setOpen('discount')
      } else if (event.key === 'F12' && lines.length > 0) {
        event.preventDefault()
        setOpen('pay')
      } else if (event.key === 'Delete' && selected !== null && !typing) {
        remove(selected)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hold])

  if (isPending) return <PageSkeleton variant="detail" />

  if (!current?.shift) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface-200">
        <TillHeader />
        <main className="p-6">
          <EmptyState
            icon="⏻"
            title={t('pos.noShift')}
            description={t('pos.noShiftBody')}
            actions={
              <Link to={paths.shift} className={buttonVariants()}>
                {t('pos.openShift')}
              </Link>
            }
          />
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-surface-200">
      <TillHeader>
        <HeldTabs />
        <Button size="sm" variant="ghost" className="text-on-navy" onClick={() => setOpen('held')}>
          {t('held.title')}
        </Button>
      </TillHeader>
      <main className="grid min-h-0 grow gap-4 p-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        <h1 className="sr-only">{t('pos.title')}</h1>
        <CartPanel
          onPay={() => setOpen('pay')}
          onHold={() => void hold()}
          onDiscount={() => setOpen('discount')}
        />
        <ProductSearch />
      </main>
      <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border bg-surface-100 px-4 py-2 text-caption text-ink-muted">
        {SHORTCUTS.map(([key, action]) => (
          <span key={key}>
            <kbd className="rounded border border-border px-1">{key}</kbd>{' '}
            {t(`pos.shortcuts.${action}`)}
          </span>
        ))}
      </footer>

      {open === 'pay' && (
        <PaymentDialog
          open
          onClose={() => setOpen(null)}
          onPaid={(invoice) => {
            setOpen(null)
            setReceipt(invoice)
          }}
        />
      )}
      {open === 'discount' && <DiscountDialog open onClose={() => setOpen(null)} />}
      <HeldDrawer
        open={open === 'held'}
        onClose={() => {
          setOpen(null)
          if (params.has('held')) setParams({}, { replace: true })
        }}
      />
      <ReceiptDialog
        invoice={receipt}
        onClose={() => {
          setReceipt(null)
          document.getElementById(SEARCH_INPUT_ID)?.focus()
        }}
      />
    </div>
  )
}
