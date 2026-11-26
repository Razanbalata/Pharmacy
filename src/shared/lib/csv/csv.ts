/** Puts quotes around a cell when it holds a comma, a quote or a new line. */
function cell(value: string | number): string {
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Rows to CSV text. It starts with a byte-order mark, so Excel opens Arabic correctly
 * instead of showing it scrambled.
 */
export function toCsv(rows: (string | number)[][]): string {
  return `﻿${rows.map((row) => row.map(cell).join(',')).join('\r\n')}`
}

/** Saves rows as a .csv file in the browser's downloads. */
export function downloadCsv(name: string, rows: (string | number)[][]): void {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
