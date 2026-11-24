import { HomePage } from '@/pages/home'
import { ThemeProvider } from './theme/ThemeProvider'
import './styles/index.css'

export function App() {
  return (
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  )
}
