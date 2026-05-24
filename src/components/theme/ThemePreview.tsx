'use client'

import type { CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemePreviewProps {
  color: string
  label: string
  selected: boolean
  onSelect: () => void
}

export default function ThemePreview({ color, label, selected, onSelect }: ThemePreviewProps) {
  const style = { '--preview-accent': color } as CSSProperties

  return (
    <button
      type="button"
      onClick={onSelect}
      title={label}
      aria-pressed={selected}
      className={cn(
        'group relative h-9 w-9 rounded-full p-0.5 transition-all duration-[250ms] hover:-translate-y-0.5 focus-visible:outline-none',
        selected
          ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-white dark:ring-offset-slate-950'
          : 'hover:ring-2 hover:ring-[var(--preview-accent)]/30'
      )}
      style={style}
    >
      <span
        className="absolute inset-0 rounded-full opacity-0 blur-md transition-opacity duration-[250ms] group-hover:opacity-[.35]"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full shadow-sm"
        style={{ backgroundColor: color }}
      >
        <span className="absolute inset-x-0 top-0 h-1/2 bg-white/20" />
        {selected && <Check className="relative h-4 w-4 text-white drop-shadow-sm" strokeWidth={4} />}
      </span>
    </button>
  )
}
