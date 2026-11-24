import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('is a plain button by default so it never submits a form by accident', () => {
    render(<Button>حفظ</Button>)
    expect(screen.getByRole('button', { name: 'حفظ' })).toHaveAttribute('type', 'button')
  })

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn<() => void>()
    render(<Button onClick={onClick}>بيع</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'بيع' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire when disabled', async () => {
    const onClick = vi.fn<() => void>()
    render(
      <Button disabled onClick={onClick}>
        دفع
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'دفع' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
