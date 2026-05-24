'use client'

import { useEffect, useState } from 'react'

const AUTH_STORAGE_KEY = 'auth-storage'
const AUTH_STORAGE_MODE_KEY = 'auth-storage-mode'

function decodeBase64UrlJson(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

function readPayloadFromHash() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return params.get('payload')
}

export default function ImpersonateHandoffPage() {
  const [error, setError] = useState('')

  useEffect(() => {
    let finished = false

    const openTenantSession = (encodedPayload: string | null) => {
      if (!encodedPayload) {
        setError('Tenant sessiyasi kutilmoqda...')
        return false
      }

      if (finished) return true

      try {
        const payload = decodeBase64UrlJson(encodedPayload)
        if (!payload?.access_token || !payload?.user) {
          setError("Tenant sessiyasi noto'g'ri")
          return true
        }

        finished = true
        sessionStorage.setItem(AUTH_STORAGE_MODE_KEY, 'session')
        sessionStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            state: {
              user: payload.user,
              token: payload.access_token,
              refreshToken: payload.refresh_token ?? null,
              isAuthenticated: true,
              tenant: payload.tenant ?? null,
            },
            version: 1,
          })
        )

        window.location.replace('/admin')
        return true
      } catch {
        setError("Tenant sessiyasini ochib bo'lmadi")
        return true
      }
    }

    const handleHashChange = () => {
      openTenantSession(readPayloadFromHash())
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'orbitech:impersonate') return
      if (typeof event.data.payload !== 'string') return
      openTenantSession(event.data.payload)
    }

    openTenantSession(readPayloadFromHash())
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-7 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {error || 'Tenant oynasi ochilmoqda'}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Bu oynani yopmang
          </p>
        </div>
      </div>
    </div>
  )
}
