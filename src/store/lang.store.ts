'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Language = 'uz' | 'ru' | 'en'

interface LangState {
  lang: Language
  setLang: (lang: Language) => void
}

export const LANG_STORAGE_KEY = 'lang-storage'

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'uz',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: LANG_STORAGE_KEY,
      version: 1,
      migrate: (persistedState: any, version: number) => {
        return persistedState as LangState
      },
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
    }
  )
)

