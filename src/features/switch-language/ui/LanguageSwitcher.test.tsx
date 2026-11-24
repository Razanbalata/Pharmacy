import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLanguageStore } from '@/shared/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

describe('LanguageSwitcher', () => {
  beforeEach(() => useLanguageStore.setState({ language: 'ar' }))

  it('saves English when the user picks it', async () => {
    render(<LanguageSwitcher />)
    await userEvent.click(screen.getByRole('radio', { name: 'English' }))
    expect(useLanguageStore.getState().language).toBe('en')
  })
})
