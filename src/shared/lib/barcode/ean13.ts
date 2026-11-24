/*
 * EAN-13, the barcode on almost every medicine box. Enough of it to print a label:
 * the check digit, and the 95 black-or-white modules a scanner reads.
 */

const L = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
]
const G = [
  '0100111',
  '0110011',
  '0011011',
  '0100001',
  '0011101',
  '0111001',
  '0000101',
  '0010001',
  '0001001',
  '0010111',
]
const R = [
  '1110010',
  '1100110',
  '1101100',
  '1000010',
  '1011100',
  '1001110',
  '1010000',
  '1000100',
  '1001000',
  '1110100',
]
/** Which of L or G each of the six left digits uses, chosen by the first digit. */
const PARITY = [
  'LLLLLL',
  'LLGLGG',
  'LLGGLG',
  'LLGGGL',
  'LGLLGG',
  'LGGLLG',
  'LGGGLL',
  'LGLGLG',
  'LGLGGL',
  'LGGLGL',
]

/** The 13th digit, from the first 12. */
export function ean13CheckDigit(first12: string): number {
  let sum = 0
  for (let index = 0; index < 12; index += 1) {
    sum += Number(first12[index]) * (index % 2 === 0 ? 1 : 3)
  }
  return (10 - (sum % 10)) % 10
}

export function isEan13(code: string): boolean {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12])
}

/** 95 modules, true for black. Accepts any 13 digits, so a box with a wrong check digit still prints. */
export function ean13Modules(code: string): boolean[] {
  if (!/^\d{13}$/.test(code)) throw new Error('EAN-13 needs 13 digits')
  const digits = [...code].map(Number)
  const parity = PARITY[digits[0] ?? 0] ?? PARITY[0]!
  let bits = '101'
  for (let index = 1; index <= 6; index += 1) {
    const table = parity[index - 1] === 'L' ? L : G
    bits += table[digits[index] ?? 0]
  }
  bits += '01010'
  for (let index = 7; index <= 12; index += 1) bits += R[digits[index] ?? 0]
  bits += '101'
  return [...bits].map((bit) => bit === '1')
}

/**
 * An internal code for a product with no barcode. Starts with 2, the range shops keep
 * for their own codes, so it never clashes with a real product.
 */
export function internalEan13(productId: number): string {
  const first12 = `2${String(productId).padStart(11, '0')}`
  return `${first12}${ean13CheckDigit(first12)}`
}
