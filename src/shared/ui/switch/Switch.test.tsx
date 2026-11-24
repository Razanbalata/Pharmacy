import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Switch } from './Switch'

describe('Switch', () => {
  it('is a named switch that toggles with the keyboard', async () => {
    render(
      <>
        <label htmlFor="shifts">نظام الورديات</label>
        <Switch id="shifts" defaultChecked />
      </>,
    )
    const control = screen.getByRole('switch', { name: 'نظام الورديات' })
    expect(control).toBeChecked()
    control.focus()
    await userEvent.keyboard(' ')
    expect(control).not.toBeChecked()
  })
})
