'use client'
import { useEffect, useRef } from 'react'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'
import { generateColorTokens, normalizeHexColor } from '@/lib/theme-colors'

export default function ThemeProvider() {
  const user = useAuthStore((s) => s.user)
  const theme = useThemeStore((s) => s.theme)
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const accentColor = useThemeStore((s) => s.accentColor)
  const setScope = useThemeStore((s) => s.setScope)
  const setResolvedTheme = useThemeStore((s) => s.setResolvedTheme)
  const isFirst = useRef(true)

  // Handle user-based scope automatically
  useEffect(() => {
    const scope = user ? `${user.role}:${user.id}` : 'guest'
    setScope(scope)
  }, [user, setScope])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const syncResolvedTheme = () => {
      setResolvedTheme(theme === 'system' ? (media.matches ? 'dark' : 'light') : theme)
    }

    syncResolvedTheme()
    media.addEventListener('change', syncResolvedTheme)
    return () => media.removeEventListener('change', syncResolvedTheme)
  }, [theme, setResolvedTheme])

  useEffect(() => {
    const html = document.documentElement
    let timeoutId: number | undefined

    if (!isFirst.current) html.classList.add('theme-transition')

    if (resolvedTheme === 'dark') html.classList.add('dark')
    else html.classList.remove('dark')

    const normalizedAccent = normalizeHexColor(accentColor)
    const tokens = generateColorTokens(normalizedAccent, resolvedTheme === 'dark')
    Object.entries(tokens).forEach(([key, value]) => {
      html.style.setProperty(key, value as string)
    })
    html.style.setProperty('--accent-source', normalizedAccent)
    html.dataset.theme = resolvedTheme
    html.dataset.themeMode = theme
    html.dataset.accent = normalizedAccent
    html.style.colorScheme = resolvedTheme

    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (themeMeta) themeMeta.content = resolvedTheme === 'dark' ? '#0b120a' : normalizedAccent

    if (!isFirst.current) {
      requestAnimationFrame(() => {
        timeoutId = window.setTimeout(() => html.classList.remove('theme-transition'), 380)
      })
    }

    isFirst.current = false
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [theme, resolvedTheme, accentColor])

  return null
}
