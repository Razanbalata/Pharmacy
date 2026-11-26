import { fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useDismiss } from './useDismiss'

function Box({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, open, onDismiss)
  return (
    <div>
      <div ref={ref}>داخل</div>
      <p>خارج</p>
    </div>
  )
}

describe('useDismiss', () => {
  it('closes on a press outside or on Escape, not on a press inside', () => {
    const onDismiss = vi.fn<() => void>()
    render(<Box open onDismiss={onDismiss} />)
    fireEvent.mouseDown(screen.getByText('داخل'))
    expect(onDismiss).not.toHaveBeenCalled()
    fireEvent.mouseDown(screen.getByText('خارج'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledTimes(2)
  })

  it('does nothing while closed', () => {
    const onDismiss = vi.fn<() => void>()
    render(<Box open={false} onDismiss={onDismiss} />)
    fireEvent.mouseDown(screen.getByText('خارج'))
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
