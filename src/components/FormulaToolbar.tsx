'use client'
import { RefObject, useState } from 'react'

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
}

const ROWS = [
  {
    label: 'xₙ',
    title: 'Pastki indeks (subscript)',
    chars: ['₀','₁','₂','₃','₄','₅','₆','₇','₈','₉','₊','₋','₌','₍','₎'],
  },
  {
    label: 'xⁿ',
    title: 'Yuqori daraja (superscript)',
    chars: ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','⁺','⁻','⁼','⁽','⁾'],
  },
  {
    label: '±',
    title: 'Belgilar',
    chars: ['→','←','↔','°','×','÷','±','≤','≥','≠','≈','∞','√','α','β','γ','δ','λ','π','μ','Δ','Σ'],
  },
]

export default function FormulaToolbar({ textareaRef, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [activeRow, setActiveRow] = useState(0)

  const insert = (char: string) => {
    const el = textareaRef.current
    if (!el) {
      onChange(value + char)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const next = value.slice(0, start) + char + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + char.length
    })
  }

  return (
    <div className="mb-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
          open
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
            : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        <span className="text-[13px]">H₂O · xⁿ</span>
        <span className="opacity-60">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-1.5 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-md overflow-hidden">
          {/* Tab row */}
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            {ROWS.map((row, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveRow(i)}
                title={row.title}
                className={`flex-1 py-1.5 text-[12px] font-bold transition-colors ${
                  activeRow === i
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                }`}
              >
                {row.label}
              </button>
            ))}
          </div>

          {/* Char buttons */}
          <div className="flex flex-wrap gap-1 p-2">
            {ROWS[activeRow].chars.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => insert(char)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[14px] font-medium text-gray-800 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 active:scale-90 dark:border-gray-600 dark:bg-gray-700/60 dark:text-gray-200 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/30"
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
