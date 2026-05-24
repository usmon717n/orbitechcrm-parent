'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useLangStore } from '@/store/lang.store'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const lang = useLangStore((s) => s.lang)

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
      router.replace('/auth/login')
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout, router])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  return <>{children}</>
}
