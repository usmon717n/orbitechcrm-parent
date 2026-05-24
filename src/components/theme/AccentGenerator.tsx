'use client'

import { useRef } from 'react'
import { Pipette } from 'lucide-react'

interface AccentGeneratorProps {
  value: string
  onChange: (value: string) => void
}

export default function AccentGenerator({ value, onChange }: AccentGeneratorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 shadow-sm transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] dark:border-slate-700 dark:bg-slate-800"
      aria-label="Custom accent color"
    >
      <Pipette className="h-4 w-4" />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </button>
  )
}
