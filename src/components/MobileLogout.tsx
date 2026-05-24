'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function MobileLogout() {
  const logout = useAuthStore((s) => s.logout)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const router = useRouter()
  const { t } = useI18n()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleConfirmLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch {
      // Logout should not block local session cleanup
    } finally {
      logout()
      router.push('/auth/login')
      setLoggingOut(false)
    }
  }

  return (
    <div className="mt-4 lg:hidden">
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200/80 dark:border-red-700/50 bg-red-50/80 dark:bg-red-900/20 px-4 py-3 text-red-600 dark:text-red-300 font-semibold transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <LogOut className="w-4 h-4" />
        <span>{t('nav.logout')}</span>
      </button>
      <ConfirmDialog
        open={showConfirm}
        title={t('settings.logoutConfirm', "Rostdan ham chiqmoqchimisiz?")}
        confirmLabel={t('nav.logout')}
        cancelLabel={t('common.cancel', 'Bekor')}
        processingLabel={t('common.loading')}
        confirming={loggingOut}
        tone="danger"
        onCancel={() => {
          if (loggingOut) return
          setShowConfirm(false)
        }}
        onConfirm={() => { void handleConfirmLogout() }}
      />
    </div>
  )
}
