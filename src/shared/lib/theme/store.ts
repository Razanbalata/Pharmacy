import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemePreference } from './theme'

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

/** The saved theme choice, kept per browser. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    { name: 'ps-theme' },
  ),
)
