/** A spreadsheet reduced to what the wizard needs: the header row and text cells. */
export interface Table {
  fileName: string
  headers: string[]
  rows: string[][]
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const MAX_ROWS = 5000

export type TableError = 'tooBig' | 'tooManyRows' | 'empty' | 'unreadable' | 'type'

export class TableReadError extends Error {
  readonly reason: TableError
  constructor(reason: TableError) {
    super(reason)
    this.reason = reason
  }
}

function isoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Every cell as text. Excel dates become YYYY-MM-DD so the server reads one format. */
export function cellText(cell: unknown): string {
  if (cell === null || cell === undefined) return ''
  if (cell instanceof Date) return isoDate(cell)
  return String(cell).trim()
}

/**
 * Splits CSV text, with quotes around cells that hold commas or line breaks.
 * Also accepts semicolons, which Excel uses in some Arabic and European settings.
 */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, '')
  const firstLine = source.slice(0, source.indexOf('\n') === -1 ? undefined : source.indexOf('\n'))
  const separator = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === separator) {
      row.push(cell.trim())
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ''
    } else cell += char
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell.trim())
    rows.push(row)
  }
  return rows.filter((cells) => cells.some((value) => value !== ''))
}

/** Reads an .xlsx or .csv file. Excel support loads only when an Excel file is picked. */
export async function readTable(file: File): Promise<Table> {
  if (file.size > MAX_FILE_BYTES) throw new TableReadError('tooBig')
  const name = file.name.toLowerCase()
  let grid: string[][]
  try {
    if (name.endsWith('.csv') || name.endsWith('.txt')) {
      grid = parseCsv(await file.text())
    } else if (name.endsWith('.xlsx')) {
      const { readSheet } = await import('read-excel-file/browser')
      const data = await readSheet(file)
      grid = data
        .map((cells) => cells.map(cellText))
        .filter((cells) => cells.some((value) => value !== ''))
    } else {
      throw new TableReadError('type')
    }
  } catch (error) {
    if (error instanceof TableReadError) throw error
    throw new TableReadError('unreadable')
  }
  const [headers, ...rows] = grid
  if (!headers || rows.length === 0) throw new TableReadError('empty')
  if (rows.length > MAX_ROWS) throw new TableReadError('tooManyRows')
  return { fileName: file.name, headers, rows }
}

/** Quotes what needs quoting, and starts with a BOM so Excel opens Arabic text correctly. */
export function toCsv(rows: string[][]): string {
  const quote = (value: string) =>
    /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  return `﻿${rows.map((cells) => cells.map(quote).join(',')).join('\r\n')}`
}
