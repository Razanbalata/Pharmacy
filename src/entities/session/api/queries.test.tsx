import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useCurrentUser } from './queries'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useCurrentUser', () => {
  it('loads the signed-in user with role and pharmacy', async () => {
    const { result } = renderHook(() => useCurrentUser(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.role).toBe('manager')
    const user = result.current.data
    expect(user && 'pharmacy' in user ? user.pharmacy.name : null).toBe('صيدلية الشفاء')
  })

  it('returns the role chosen for the fake server', async () => {
    localStorage.setItem('mockRole', 'cashier')
    const { result } = renderHook(() => useCurrentUser(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.role).toBe('cashier')
  })
})
