import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast, useToastStore } from './store'
import { Toaster } from './Toaster'

describe('toast', () => {
  beforeEach(() => useToastStore.setState({ toasts: [] }))
  afterEach(() => vi.useRealTimers())

  it('shows a message and runs its action', async () => {
    const undo = vi.fn<() => void>()
    render(<Toaster />)
    act(() => {
      toast.success('انوقف حساب أحمد شحادة', { label: 'تراجع', onClick: undo })
    })
    expect(screen.getByText('انوقف حساب أحمد شحادة')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'تراجع' }))
    expect(undo).toHaveBeenCalledOnce()
    expect(screen.queryByText('انوقف حساب أحمد شحادة')).not.toBeInTheDocument()
  })

  it('disappears by itself after a few seconds', () => {
    vi.useFakeTimers()
    render(<Toaster />)
    act(() => {
      toast.info('رح نبيع من الدفعة اللي بتنتهي أول')
    })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.queryByText('رح نبيع من الدفعة اللي بتنتهي أول')).not.toBeInTheDocument()
  })

  it('keeps at most three on screen', () => {
    for (const n of [1, 2, 3, 4]) toast.info(`رسالة ${n}`)
    expect(useToastStore.getState().toasts.map((item) => item.message)).toEqual([
      'رسالة 2',
      'رسالة 3',
      'رسالة 4',
    ])
  })
})
