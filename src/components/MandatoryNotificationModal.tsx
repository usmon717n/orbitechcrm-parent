'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BellRing, CheckCircle2 } from 'lucide-react'
import { notificationsApi } from '@/lib/api'

interface MandatoryNotif {
  id: string
  title: string
  message: string
  createdAt: string
}

export default function MandatoryNotificationModal() {
  const [queue, setQueue] = useState<MandatoryNotif[]>([])
  const [acknowledging, setAcknowledging] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    notificationsApi.getMandatoryUnread()
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setQueue(res.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const current = queue[0] ?? null

  const handleAcknowledge = async () => {
    if (!current || acknowledging) return
    setAcknowledging(true)
    try {
      await notificationsApi.markAsRead(current.id)
      setQueue((prev) => prev.slice(1))
    } catch {
      /* ignore */
    } finally {
      setAcknowledging(false)
    }
  }

  if (!loaded || !current) return null

  return (
    <AnimatePresence>
      <motion.div
        key="mandatory-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.65)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl dark:bg-gray-900"
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-[var(--accent)] to-orange-400" />

            {/* Body — scrollable */}
            <div className="overflow-y-auto px-6 py-6 space-y-4">
              {/* Icon + badge */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-orange-400 text-white shadow-md shadow-orange-500/30">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  {queue.length > 1 && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {queue.length} ta xabar qoldi
                    </p>
                  )}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-[18px] font-black leading-tight tracking-tight text-gray-900 dark:text-white">
                {current.title}
              </h2>

              {/* Divider */}
              <div className="h-px w-full bg-gray-100 dark:bg-white/5" />

              {/* Message */}
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {current.message}
              </p>

              {/* Timestamp */}
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {(() => {
                  const d = new Date(current.createdAt)
                  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
                  const hh = String(d.getHours()).padStart(2, '0')
                  const mm = String(d.getMinutes()).padStart(2, '0')
                  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`
                })()}
              </p>
            </div>

            {/* Footer — always visible at bottom */}
            <div className="shrink-0 border-t border-gray-100 dark:border-white/5 px-6 py-4">
              <motion.button
                type="button"
                onClick={handleAcknowledge}
                disabled={acknowledging}
                whileTap={{ scale: 0.97 }}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--accent)] font-black uppercase tracking-widest text-[14px] text-white shadow-[0_6px_20px_var(--accent-glow)] transition-all hover:brightness-110 disabled:opacity-60"
              >
                {acknowledging ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    O'qidim va tushundim
                  </>
                )}
              </motion.button>
              <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-500">
                Davom etish uchun xabarni o'qib tasdiqlang
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
