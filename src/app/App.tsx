import { createBrowserRouter, RouterProvider } from 'react-router'
import { LanguageProvider } from './i18n/LanguageProvider'
import { QueryProvider } from './query/QueryProvider'
import { routes } from './routes/routes'
import { ThemeProvider } from './theme/ThemeProvider'
import './styles/index.css'

const router = createBrowserRouter(routes)

export function App() {
  return (
    <QueryProvider>
      <LanguageProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </LanguageProvider>
    </QueryProvider>
  )
}
