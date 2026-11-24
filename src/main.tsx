import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { env } from '@/shared/config'

async function enableMocks(): Promise<void> {
  // The fake server is only bundled into development builds.
  if (!import.meta.env.DEV || !env.VITE_API_MOCKS) return
  const { startMockServer } = await import('@/app/mocks/browser')
  await startMockServer()
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

void enableMocks().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
