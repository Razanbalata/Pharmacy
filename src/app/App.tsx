import { HomePage } from '@/pages/home'
import { LanguageProvider } from './i18n/LanguageProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import './styles/index.css'

export function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <HomePage />
      </ThemeProvider>
    </LanguageProvider>
  )
}
