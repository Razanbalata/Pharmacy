import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { cartTotals, useCart, type CartLine } from '@/entities/cart'
import { customerQueries } from '@/entities/customer'
import { deleteHeld, holdSale, invoiceQueries, type HeldSale } from '@/entities/invoice'
import { productQueries } from '@/entities/product'
import { toast } from '@/shared/ui/toast'

/** "فاتورة N": one more than any sale label in use, so tabs never share a name. */
function nextLabel(current: string, held: HeldSale[]): string {
  const numbers = [current, ...held.map((sale) => sale.label)].map(
    (label) => Number(label.replace(/\D/g, '')) || 0,
  )
  return `فاتورة ${Math.max(...numbers) + 1}`
}

export function useHeldSales() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: held = [] } = useQuery(invoiceQueries.held())

  /** Puts the current sale aside and starts a fresh one. */
  async function hold() {
    const { lines, customer, discount, label, clear } = useCart.getState()
    if (lines.length === 0) {
      clear(nextLabel(label, held))
      return
    }
    await holdSale({
      label,
      customerId: customer?.id ?? null,
      discount,
      total: cartTotals(lines, discount).total,
      lines: lines.map((line) => ({
        productId: line.productId,
        unitIndex: line.unitIndex,
        quantity: line.quantity,
        name: line.name,
      })),
    })
    await queryClient.invalidateQueries({ queryKey: invoiceQueries.held().queryKey })
    toast.success(t('pos.held', { label }))
    clear(nextLabel(label, [...held, { label } as HeldSale]))
  }

  /** Brings a held sale back to the till, with today's stock and batches. */
  async function resume(sale: HeldSale): Promise<boolean> {
    if (useCart.getState().lines.length > 0) {
      toast.error(t('held.replaceBody'))
      return false
    }
    const today = new Date().toISOString().slice(0, 10)
    const lines: CartLine[] = []
    for (const item of sale.lines) {
      const product = await queryClient.fetchQuery(productQueries.detail(item.productId))
      const sellable = product.batches.filter((batch) => batch.expiry >= today)
      const first = sellable[0]
      if (!first) continue
      lines.push({
        productId: product.id,
        name: product.name,
        ingredient: product.ingredient?.name ?? null,
        prescription: product.prescription,
        units: product.units,
        unitIndex: item.unitIndex,
        quantity: item.quantity,
        batch: first.code,
        expiry: first.expiry,
        stock: sellable.reduce((sum, batch) => sum + batch.quantity, 0),
        minStock: product.minStock,
      })
    }
    const customer = sale.customer
      ? ((await queryClient.fetchQuery(customerQueries.options(sale.customer.name))).find(
          (item) => item.id === sale.customer?.id,
        ) ?? null)
      : null
    useCart.getState().load({ label: sale.label, lines, customer, discount: sale.discount })
    await deleteHeld(sale.id)
    await queryClient.invalidateQueries({ queryKey: invoiceQueries.held().queryKey })
    toast.success(t('held.resumed', { label: sale.label }))
    return true
  }

  async function cancel(sale: HeldSale) {
    await deleteHeld(sale.id)
    await queryClient.invalidateQueries({ queryKey: invoiceQueries.held().queryKey })
    toast.success(t('held.removed', { label: sale.label }))
  }

  return { held, hold, resume, cancel }
}
