const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * A price as the pharmacy writes it: two decimals, Western digits, no symbol.
 * The ₪ goes next to it in the page, so tables can line the numbers up.
 */
export function formatMoney(amount: number): string {
  return formatter.format(amount)
}

/** Rounds to agorot, so 0.1 + 0.2 never shows as 0.30000000000000004. */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}
