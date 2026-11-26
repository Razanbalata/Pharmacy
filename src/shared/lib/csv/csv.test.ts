import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('starts with a byte-order mark and quotes only what needs it', () => {
    expect(
      toCsv([
        ['الاسم', 'الدين'],
        ['أبو أحمد, الشوا', 180],
        ['قال "مرحبا"', 0],
      ]),
    ).toBe('﻿الاسم,الدين\r\n"أبو أحمد, الشوا",180\r\n"قال ""مرحبا""",0')
  })
})
