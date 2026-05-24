'use client'

import { Palette } from 'lucide-react'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'

export default function AccentColorPicker() {
  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backdrop-blur-3xl transition-colors dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)] transition-colors">
          <Palette className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-900 dark:text-white">Tizim rangi</p>
          <p className="text-xs font-medium text-slate-500">Platforma uchun asosiy rangni tanlang</p>
        </div>
      </div>

      <ThemeSwitcher section="accent" showPreview />
    </div>
  )
}
