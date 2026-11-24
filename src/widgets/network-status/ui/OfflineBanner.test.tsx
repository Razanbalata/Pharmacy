import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OfflineBanner } from './OfflineBanner'

function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
  window.dispatchEvent(new Event(value ? 'online' : 'offline'))
}

describe('OfflineBanner', () => {
  afterEach(() => vi.restoreAllMocks())

  it('stays hidden while online with nothing waiting', () => {
    setOnline(true)
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('appears when the connection drops', () => {
    setOnline(true)
    render(<OfflineBanner />)
    act(() => setOnline(false))
    expect(screen.getByRole('status')).toHaveTextContent('الاتصال مقطوع')
  })
})
