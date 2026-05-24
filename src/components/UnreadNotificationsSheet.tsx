'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, BookOpen, CalendarCheck2, CheckCheck,
  ChevronDown, CreditCard, X,
} from 'lucide-react'
import { notificationsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Notif {
  id: string
  title: string
  message: string
  isRead: boolean
  isMandatory: boolean
  createdAt: string
}

const SESSION_KEY = 'unread_sheet_shown'
const SHOW_THRESHOLD = 3

function getNotifIcon(title: string) {
  const t = title.toLowerCase()
  if (t.includes('davomat') || t.includes('kelmadi') || t.includes('kech')) return CalendarCheck2
  if (t.includes('vazifa') || t.includes('homework') || t.includes('topshir')) return BookOpen
  if (t.includes('to\'lov') || t.includes('payment') || t.includes('qarzdor')) return CreditCard
  return Bell
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffD = Math.floor(diffMs / 86_400_000)
  if (diffH < 1) return 'Hozirgina'
  if (diffH < 24) return `${diffH} soat oldin`
  if (diffD < 7) return `${diffD} kun oldin`
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })
}

export default function UnreadNotificationsSheet() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [markingAll, setMarkingAll] = useState(false)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

    // Sessiya ichida bir marta ko'rsatiladi
    if (sessionStorage.getItem(SESSION_KEY)) return

    notificationsApi.getUnreadCount().then((res) => {
      const count = Number(res.data?.count ?? 0)
      if (count < SHOW_THRESHOLD) return
      setUnreadCount(count)

      return notificationsApi.getMy({ page: 1, limit: 30 }).then((r) => {
        const unread: Notif[] = (r.data?.data ?? []).filter((n: Notif) => !n.isRead && !n.isMandatory)
        if (unread.length >= SHOW_THRESHOLD) {
          setNotifs(unread)
          setOpen(true)
          sessionStorage.setItem(SESSION_KEY, '1')
        }
      })
    }).catch(() => {})
  }, [])

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllAsRead()
      window.dispatchEvent(new CustomEvent('notifications:count-changed', { detail: { count: 0 } }))
      setOpen(false)
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false)
    }
  }

  const handleClose = () => setOpen(false)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[9991] flex flex-col rounded-t-[28px] bg-white dark:bg-gray-900 shadow-2xl"
            style={{ maxHeight: '82dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
                  <Bell className="h-5 w-5 text-red-500" />
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-[15px]">O'qilmagan xabarlar</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{notifs.length} ta yangi bildirishnoma</p>
                </div>
              </div>
              <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <BellOff className="h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-400">Bildirishnomalar yo'q</p>
                </div>
              ) : (
                notifs.map((n) => {
                  const Icon = getNotifIcon(n.title)
                  return (
                    <div
                      key={n.id}
                      className="flex gap-3 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-3"
                    >
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        n.title.toLowerCase().includes('davomat') || n.title.toLowerCase().includes('kelmadi')
                          ? 'bg-red-100 text-red-500 dark:bg-red-900/20'
                          : n.title.toLowerCase().includes('vazifa') || n.title.toLowerCase().includes('topshir')
                          ? 'bg-blue-100 text-blue-500 dark:bg-blue-900/20'
                          : 'bg-[var(--accent)]/10 text-[var(--accent)]'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">{n.title}</p>
                          <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{fmtDate(n.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">{n.message}</p>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Scroll hint */}
              {notifs.length > 5 && (
                <div className="flex justify-center pb-2 text-gray-300 dark:text-white/10">
                  <ChevronDown className="h-4 w-4 animate-bounce" />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-white/5 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 h-11 rounded-2xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Yopish
              </button>
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="flex-1 h-11 rounded-2xl bg-[var(--accent)] text-sm font-bold text-white shadow-[0_4px_12px_var(--accent-glow)] transition-all hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {markingAll ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    Hammasini o'qildi
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
