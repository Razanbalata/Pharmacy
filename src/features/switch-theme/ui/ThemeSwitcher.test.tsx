import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useThemeStore } from '@/shared/lib/theme'
import { ThemeSwitcher } from './ThemeSwitcher'
import { ThemeToggle } from './ThemeToggle'

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

describe('ThemeToggle', () => {
  beforeEach(() => useThemeStore.setState({ preference: 'light' }))

  it('flips light to dark and back with one button', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'التبديل للوضع الليلي' }))
    expect(useThemeStore.getState().preference).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: 'التبديل للوضع النهاري' }))
    expect(useThemeStore.getState().preference).toBe('light')
  })
})
