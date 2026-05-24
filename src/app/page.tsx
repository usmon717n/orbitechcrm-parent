'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { readAuthFromStorage } from '@/store/auth.store'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
        <span className="font-brand text-lg tracking-wide">OrbitechCRM</span>
        <div className="w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const { user, isAuthenticated } = readAuthFromStorage()
    if (isAuthenticated && user) {
      const path = user.role === 'PARENT' ? '/parent' : '/auth/login'
      router.replace(path)
    } else {
      router.replace('/auth/login')
    }
  }, [router])

  return <Spinner />
}
