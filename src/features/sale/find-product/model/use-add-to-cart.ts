import { useQueryClient } from '@tanstack/react-query'
import { useCart } from '@/entities/cart'
import { productQueries } from '@/entities/product'

/** The search box on the till, so a shortcut (F2) can jump to it. */
export const SEARCH_INPUT_ID = 'pos-search'

/** Adds a product to the sale, taking the batch that expires first and leaving expired ones. */
export function useAddToCart() {
  const queryClient = useQueryClient()
  const add = useCart((state) => state.add)
  return async (productId: number): Promise<boolean> => {
    const product = await queryClient.fetchQuery(productQueries.detail(productId))
    const today = new Date().toISOString().slice(0, 10)
    const sellable = product.batches.filter((batch) => batch.expiry >= today)
    const stock = sellable.reduce((sum, batch) => sum + batch.quantity, 0)
    const first = sellable[0]
    if (!product.active || stock <= 0 || !first) return false
    add({
      productId: product.id,
      name: product.name,
      ingredient: product.ingredient?.name ?? null,
      prescription: product.prescription,
      units: product.units,
      batch: first.code,
      expiry: first.expiry,
      stock,
      minStock: product.minStock,
    })
    return true
  }
}
