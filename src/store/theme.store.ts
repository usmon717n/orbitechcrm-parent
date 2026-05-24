'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_ACCENT, normalizeHexColor } from '@/lib/theme-colors'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'
type ThemePreferences = { theme: Theme; accentColor: string; primaryColor: string }
type ThemeColorPatch = Partial<{ accentColor: string; primaryColor: string }>

interface ThemeState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  accentColor: string
  primaryColor: string
  scope: string
  preferencesByScope: Record<string, ThemePreferences>
  setScope: (scope: string) => void
  setTheme: (theme: Theme) => void
  setResolvedTheme: (theme: ResolvedTheme) => void
  toggle: () => void
  setAccentColor: (color: string) => void
  setColors: (colors: ThemeColorPatch) => void
}

const DEFAULT_SCOPE = 'guest'
const DEFAULT_PREFERENCES: ThemePreferences = {
  theme: 'light',
  accentColor: DEFAULT_ACCENT,
  primaryColor: DEFAULT_ACCENT,
}

function getPreferences(map: Record<string, ThemePreferences>, scope: string) {
  const preferences = map[scope] ?? DEFAULT_PREFERENCES
  const accentColor = normalizeHexColor(preferences.accentColor ?? preferences.primaryColor)
  const primaryColor = normalizeHexColor(preferences.primaryColor ?? accentColor)
  return { ...DEFAULT_PREFERENCES, ...preferences, accentColor, primaryColor }
}

function savePreferences(state: ThemeState, patch: Partial<ThemePreferences>): Partial<ThemeState> {
  const currentPrefs = getPreferences(state.preferencesByScope, state.scope)
  const nextPrefs = {
    ...currentPrefs,
    ...patch,
    accentColor: normalizeHexColor(patch.accentColor ?? currentPrefs.accentColor),
    primaryColor: normalizeHexColor(patch.primaryColor ?? patch.accentColor ?? currentPrefs.primaryColor),
  }
  return {
    ...nextPrefs,
    preferencesByScope: { ...state.preferencesByScope, [state.scope]: nextPrefs }
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,
      resolvedTheme: 'light',
      scope: DEFAULT_SCOPE,
      preferencesByScope: {},
      setScope: (scopeValue) =>
        set((state) => {
          const scope = scopeValue?.trim() || DEFAULT_SCOPE
          return { scope, ...getPreferences(state.preferencesByScope, scope) }
        }),
      setTheme: (theme) => set((state) => savePreferences(state, { theme })),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
      toggle: () => {
        const next: Theme = get().resolvedTheme === 'light' ? 'dark' : 'light'
        set((state) => savePreferences(state, { theme: next }))
      },
      setAccentColor: (accentColor) => {
        const color = normalizeHexColor(accentColor)
        set((state) => savePreferences(state, { accentColor: color, primaryColor: color }))
      },
      setColors: (colors) => {
        const color = normalizeHexColor(colors.accentColor ?? colors.primaryColor)
        set((state) => savePreferences(state, { accentColor: color, primaryColor: color }))
      },
    }),
    {
      name: 'theme-storage',
      version: 3,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (state) => ({ scope: state.scope, preferencesByScope: state.preferencesByScope }),
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          // Old format stored theme/accentColor/primaryColor directly without scope/preferencesByScope
          const accentColor = normalizeHexColor(persistedState?.accentColor ?? persistedState?.primaryColor ?? DEFAULT_ACCENT)
          const primaryColor = normalizeHexColor(persistedState?.primaryColor ?? accentColor)
          const theme: Theme = persistedState?.theme ?? 'light'
          return {
            scope: DEFAULT_SCOPE,
            preferencesByScope: { [DEFAULT_SCOPE]: { theme, accentColor, primaryColor } },
          }
        }
        return persistedState
      },
      merge: (persisted: any, current) => {
        const scope = persisted?.scope?.trim() || DEFAULT_SCOPE
        const preferencesByScope = persisted?.preferencesByScope ?? {}
        return { ...current, scope, preferencesByScope, ...getPreferences(preferencesByScope, scope) }
      },
    }
  )
)

export function applyTheme(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (theme === 'dark') html.classList.add('dark')
  else html.classList.remove('dark')
}
