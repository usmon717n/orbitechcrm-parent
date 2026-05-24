import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export function useSessionState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const pathname = usePathname()
  const storageKey = `ps:${pathname}:${key}`

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const raw = sessionStorage.getItem(storageKey)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  const set = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      setState((prev) => {
        const next =
          typeof value === 'function' ? (value as (p: T) => T)(prev) : value
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    [storageKey],
  )

  return [state, set]
}
