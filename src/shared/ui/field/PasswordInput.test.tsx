import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { PasswordInput } from './PasswordInput'

function Harness() {
  const [value, setValue] = useState('')
  return (
    <>
      <label htmlFor="pw">كلمة المرور</label>
      <PasswordInput
        id="pw"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        showStrength
      />
    </>
  )
}

describe('PasswordInput', () => {
  it('hides the password until asked to show it', async () => {
    render(<Harness />)
    const input = screen.getByLabelText('كلمة المرور')
    expect(input).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'إظهار' }))
    expect(input).toHaveAttribute('type', 'text')
  })

  it('rates the password as it is typed', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('كلمة المرور'), 'Pharma2026x')
    expect(screen.getByText('قوية')).toBeInTheDocument()
  })
})
