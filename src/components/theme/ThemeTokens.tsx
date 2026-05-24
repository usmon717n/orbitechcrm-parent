'use client'

const TOKENS = [
  { label: 'Accent', value: 'var(--accent)' },
  { label: 'Soft', value: 'var(--accent-soft)' },
  { label: 'Border', value: 'var(--accent-border)' },
  { label: 'Glow', value: 'var(--accent-glow-strong)' },
]

export default function ThemeTokens() {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-subtle)] p-2">
      {TOKENS.map((token) => (
        <div key={token.label} className="rounded-xl bg-white/70 p-2 shadow-sm ring-1 ring-black/5 dark:bg-slate-950/40 dark:ring-white/10">
          <div className="mb-1 h-5 rounded-lg" style={{ background: token.value }} />
          <p className="truncate text-[9px] font-black uppercase tracking-wide text-slate-400">{token.label}</p>
        </div>
      ))}
    </div>
  )
}
