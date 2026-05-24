'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { ACCENT_PRESETS, normalizeHexColor } from '@/lib/theme-colors'
import { useThemeStore, type Theme } from '@/store/theme.store'
import { cn } from '@/lib/utils'
import AccentGenerator from './AccentGenerator'
import ThemePreview from './ThemePreview'
import ThemeTokens from './ThemeTokens'

const MODE_OPTIONS: Array<{ id: Theme; label: string; icon: typeof Sun }> = [
  { id: 'light', icon: Sun, label: "Yorug'" },
  { id: 'dark', icon: Moon, label: "Qorong'i" },
  { id: 'system', icon: Monitor, label: 'Tizim' },
]

interface ThemeSwitcherProps {
  section?: 'all' | 'mode' | 'accent'
  showPreview?: boolean
  className?: string
}

export default function ThemeSwitcher({ section = 'all', showPreview = false, className }: ThemeSwitcherProps) {
  const theme = useThemeStore((state) => state.theme)
  const accentColor = useThemeStore((state) => state.accentColor)
  const setTheme = useThemeStore((state) => state.setTheme)
  const setAccentColor = useThemeStore((state) => state.setAccentColor)
  const normalizedAccent = normalizeHexColor(accentColor)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {section !== 'accent' && (
          <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-inner dark:border-slate-700/70 dark:bg-slate-800/80 sm:w-auto">
            {MODE_OPTIONS.map((option) => {
              const active = theme === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black transition-all duration-[250ms] sm:flex-none',
                    active
                      ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                  )}
                >
                  <option.icon className={cn('h-3.5 w-3.5', active && 'text-[var(--accent)]')} />
                  {option.label}
                </button>
              )
            })}
          </div>
        )}

        {section !== 'mode' && (
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((preset) => (
              <ThemePreview
                key={preset.id}
                color={preset.hex}
                label={preset.label}
                selected={normalizedAccent === preset.hex.toLowerCase()}
                onSelect={() => setAccentColor(preset.hex)}
              />
            ))}
            <AccentGenerator value={normalizedAccent} onChange={setAccentColor} />
          </div>
        )}
      </div>

      {showPreview && <ThemeTokens />}
    </div>
  )
}
