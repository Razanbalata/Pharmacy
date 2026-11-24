import { describe, expect, it } from 'vitest'
import { guessMapping, normaliseDate, toImportRows } from './columns'
import { parseCsv, toCsv } from './table'

describe('import: reading the file', () => {
  it('splits CSV with quotes, commas inside quotes and Windows line ends', () => {
    expect(parseCsv('﻿اسم,سعر\r\n"Panadol, Extra",21\r\n\r\nBrufen,"1,5"')).toEqual([
      ['اسم', 'سعر'],
      ['Panadol, Extra', '21'],
      ['Brufen', '1,5'],
    ])
  })

  it('accepts semicolons when the file uses them', () => {
    expect(parseCsv('a;b\n1;2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('writes CSV that Excel opens with Arabic intact', () => {
    expect(toCsv([['الاسم', 'a,b']])).toBe('﻿الاسم,"a,b"')
  })
})

describe('import: matching columns', () => {
  it('guesses Arabic and English headers, once per field', () => {
    expect(
      guessMapping([
        'اسم الدواء',
        'المادة',
        'القسم',
        'سعر',
        'Qty',
        'تاريخ الانتهاء',
        'الشركة',
        'ملاحظات',
        'السعر',
      ]),
    ).toEqual([
      'name',
      'ingredient',
      'category',
      'price',
      'quantity',
      'expiry',
      'manufacturer',
      null,
      null,
    ])
  })

  it('reads dates the way people write them', () => {
    expect(normaliseDate('2028-3-31')).toBe('2028-03-31')
    expect(normaliseDate('31/03/2028')).toBe('2028-03-31')
    expect(normaliseDate('02/2028')).toBe('2028-02-29')
    expect(normaliseDate('٣١/٠٣/٢٠٢٨')).toBe('2028-03-31')
    expect(normaliseDate('soon')).toBe('soon')
  })

  it('turns the table into rows with clean numbers and line numbers', () => {
    const rows = toImportRows(
      { fileName: 'x.csv', headers: ['a', 'b', 'c'], rows: [['Panadol', '٢١ ₪', 'رف 3']] },
      ['name', 'price', 'ignore'],
    )
    expect(rows).toEqual([{ line: 2, name: 'Panadol', price: '21' }])
  })
})
