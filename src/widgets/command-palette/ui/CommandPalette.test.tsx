import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@test/render'
import { usePaletteStore } from '../model/store'
import { usePaletteHotkey } from '../model/use-hotkey'
import { CommandPalette } from './CommandPalette'

function Where() {
  return <output>{useLocation().pathname + useLocation().search}</output>
}

function Harness({ userRole = 'manager' }: { userRole?: 'manager' | 'cashier' }) {
  usePaletteHotkey()
  return (
    <>
      <CommandPalette role={userRole} />
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
    </>
  )
}

describe('CommandPalette', () => {
  beforeEach(() => usePaletteStore.setState({ open: false }))

  it('opens with Ctrl+K', async () => {
    renderWithProviders(<Harness />)
    await userEvent.keyboard('{Control>}k{/Control}')
    expect(usePaletteStore.getState().open).toBe(true)
  })

  it('finds a screen typed without hamza and goes there', async () => {
    renderWithProviders(<Harness />)
    act(() => usePaletteStore.setState({ open: true }))
    await userEvent.type(screen.getByRole('combobox', { name: 'البحث الشامل' }), 'اصناف{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('/products')
    expect(usePaletteStore.getState().open).toBe(false)
  })

  it('finds a screen by its English name in the Arabic interface', async () => {
    renderWithProviders(<Harness />)
    act(() => usePaletteStore.setState({ open: true }))
    await userEvent.type(screen.getByRole('combobox'), 'suppl')
    expect(screen.getByRole('option', { name: 'الموردون' })).toBeInTheDocument()
  })

  it('never offers the cashier a screen the role cannot open', async () => {
    renderWithProviders(<Harness userRole="cashier" />)
    act(() => usePaletteStore.setState({ open: true }))
    await userEvent.type(screen.getByRole('combobox'), 'الموظف')
    expect(screen.queryByRole('option', { name: 'الموظفون' })).not.toBeInTheDocument()
    expect(screen.getByText('ما لقينا "الموظف"')).toBeInTheDocument()
  })
})
