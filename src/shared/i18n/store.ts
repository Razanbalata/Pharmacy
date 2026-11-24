import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LANGUAGE, type Language } from './config'

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

/** The saved language, per user on this browser. */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: DEFAULT_LANGUAGE,
      setLanguage: (language) => set({ language }),
    }),
    { name: 'ps-language' },
  ),
)
