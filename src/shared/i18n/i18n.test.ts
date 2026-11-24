import { describe, expect, it } from 'vitest'
import { directionOf, i18n } from './config'
import { ar } from './locales/ar'
import { en } from './locales/en'

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null
      ? keysOf(child as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

describe('i18n', () => {
  it('Arabic and English have exactly the same keys', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(ar).sort())
  })

  it('Arabic is right to left and English left to right', () => {
    expect(directionOf('ar')).toBe('rtl')
    expect(directionOf('en')).toBe('ltr')
  })

  it('fills values into messages', async () => {
    await i18n.changeLanguage('ar')
    expect(i18n.t('network.pending', { count: 3 })).toBe('بانتظار الرفع: 3')
    await i18n.changeLanguage('en')
    expect(i18n.t('network.pending', { count: 3 })).toBe('Waiting to sync: 3')
  })
})
