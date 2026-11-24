/** "38 علبة". Nothing left shows just 0, without a unit. */
export function formatQuantity(quantity: number, unit: string): string {
  return quantity === 0 ? '0' : `${quantity} ${unit}`
}
