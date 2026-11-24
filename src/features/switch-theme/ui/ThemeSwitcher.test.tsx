import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useThemeStore } from '@/shared/lib/theme'
import { ThemeSwitcher } from './ThemeSwitcher'

describe('ThemeSwitcher', () => {
  beforeEach(() => useThemeStore.setState({ preference: 'system' }))

  it('starts on the device setting', () => {
    render(<ThemeSwitcher />)
    expect(screen.getByRole('radio', { name: 'حسب الجهاز' })).toBeChecked()
  })

  it('saves the choice when the user picks dark', async () => {
    render(<ThemeSwitcher />)
    await userEvent.click(screen.getByRole('radio', { name: 'ليلي' }))
    expect(useThemeStore.getState().preference).toBe('dark')
    expect(screen.getByRole('radio', { name: 'ليلي' })).toBeChecked()
  })
})
