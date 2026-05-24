'use client'
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/theme.store'

export default function DarkModeToggle() {
  const { theme, setTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
            {isDark
              ? <Moon className="w-5 h-5 text-[var(--accent)]" />
              : <Sun className="w-5 h-5 text-[var(--accent)]" />}
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
              {isDark ? 'Qorong\'i rejim' : 'Yorug\' rejim'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isDark ? 'Yorug\' rejimga o\'tish' : 'Qorong\'i rejimga o\'tish'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
            isDark ? 'bg-[var(--accent)]' : 'bg-gray-200'
          }`}
          aria-label="Dark mode toggle"
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
            isDark ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  )
}
