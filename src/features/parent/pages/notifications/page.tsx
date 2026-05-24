'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { notificationsApi } from '@/lib/api'
import { countUnreadNotifications, type UiNotification } from '@/lib/notifications'
import { formatNotificationDate, translateNotification } from '@/lib/notificationTranslate'
import { Skeleton } from '@/components/Skeleton'
import {
  Bell, CheckCheck, Sparkles, Clock, BookOpen,
  CreditCard, Calendar, MessageSquareWarning, Trophy, Zap,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useI18n } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSocketEvent } from '@/hooks/useSocketEvent'

const FETCH_LIMIT = 100
const PAGE_SIZE = 20

function getNotifIcon(title: string) {
  const t = title.toLowerCase()
  if (t.includes('vazifa') || t.includes('homework') || t.includes('задан')) return { icon: BookOpen, color: 'bg-blue-500' }
  if (t.includes('to\'lov') || t.includes('qarz') || t.includes('платёж') || t.includes('долг')) return { icon: CreditCard, color: 'bg-red-500' }
  if (t.includes('davomat') || t.includes('kelmad') || t.includes('посещ') || t.includes('отсутств')) return { icon: Calendar, color: 'bg-amber-500' }
  if (t.includes('shikoyat') || t.includes('жалоб') || t.includes('complaint')) return { icon: MessageSquareWarning, color: 'bg-orange-500' }
  if (t.includes('xp') || t.includes('ball') || t.includes('балл') || t.includes('reyting')) return { icon: Zap, color: 'bg-yellow-500' }
  if (t.includes('test') || t.includes('quiz') || t.includes('natija')) return { icon: Trophy, color: 'bg-purple-500' }
  return { icon: Bell, color: 'bg-[var(--accent)]' }
}

function groupByDate(items: UiNotification[], lang: 'uz' | 'ru' | 'en', t: (k: string) => string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

  const labelFor = (d: Date) => {
    const day = new Date(d); day.setHours(0, 0, 0, 0)
    if (day.getTime() === today.getTime()) return t('parent.today')
    if (day.getTime() === yesterday.getTime()) return t('parent.yesterday')
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
    return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ', opts)
  }

  const groups: { label: string; items: UiNotification[] }[] = []
  const seen = new Map<string, number>()

  for (const item of items) {
    const label = labelFor(new Date(item.createdAt))
    if (seen.has(label)) {
      groups[seen.get(label)!].items.push(item)
    } else {
      seen.set(label, groups.length)
      groups.push({ label, items: [item] })
    }
  }
  return groups
}

export default function ParentNotificationsPage() {
  const { t, lang } = useI18n()
  const [notifications, setNotifications] = useState<UiNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const broadcastUnread = useCallback((count: number) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('notifications:count-changed', { detail: { count } }))
  }, [])

  const mapNotifications = (raw: any[]): UiNotification[] =>
    raw.map((item: any) => ({
      id: item.id, title: item.title, message: item.message,
      createdAt: item.createdAt, isRead: !!item.isRead,
      source: 'server' as const, href: null,
    }))

  const load = useCallback(() => {
    setLoading(true)
    notificationsApi.getMy({ page: 1, limit: FETCH_LIMIT })
      .then((res) => {
        const items = mapNotifications(Array.isArray(res.data?.data) ? res.data.data : [])
        setNotifications(items)
        setTotal(Number(res.data?.total ?? items.length))
        setUnread(typeof res.data?.unread === 'number' ? Math.max(0, Number(res.data.unread)) : countUnreadNotifications(items))
      })
      .catch(() => toast.error(t('common.error')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load])
  useEffect(() => { broadcastUnread(unread) }, [unread, broadcastUnread])

  useSocketEvent<{ id?: string; title: string; message: string; isRead?: boolean; createdAt?: string }>('notification:new', (data) => {
    const newItem: UiNotification = {
      id: data.id ?? `ws-${Date.now()}`, title: data.title, message: data.message,
      createdAt: data.createdAt ?? new Date().toISOString(),
      isRead: data.isRead ?? false, source: 'server', href: null,
    }
    setNotifications(prev => [newItem, ...prev])
    setUnread(prev => prev + 1)
    setTotal(prev => prev + 1)
  })

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnread(0)
      toast.success(t('notificationsPage.markAllSuccess'))
    } catch { toast.error(t('notificationsPage.markAllError')) }
  }

  const handleMarkOne = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch { /* silent */ }
  }

  const visible = notifications.slice(0, visibleCount)
  const hasMore = visibleCount < notifications.length
  const groups = useMemo(() => groupByDate(visible, lang, t), [visible, lang, t])

  return (
    <DashboardLayout role="PARENT" title={t('nav.notifications')}>
      <div className="max-w-lg mx-auto space-y-3 pb-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between px-4 py-3.5 rounded-3xl bg-white dark:bg-gray-900 border border-black/[0.05] dark:border-white/[0.06] shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                unread > 0 ? 'bg-[var(--accent)]' : 'bg-gray-100 dark:bg-gray-800'
              )}>
                <Bell className={cn('w-4.5 h-4.5', unread > 0 ? 'text-white' : 'text-gray-400')} />
              </div>
              <div>
                <p className="text-[13px] font-black text-gray-900 dark:text-white leading-tight">
                  {unread > 0 ? `${unread} ${t('notificationsPage.unreadCount')}` : t('notificationsPage.allRead')}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  {total} {t('common.total', 'ta')}
                </p>
              </div>
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-black active:scale-95 transition-transform"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('notificationsPage.markAll')}
              </button>
            )}
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-black/[0.05] dark:border-white/[0.06]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={cn('flex items-center gap-3 px-4 py-3.5', i !== 0 && 'border-t border-black/[0.04] dark:border-white/[0.04]')}>
                <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/5 rounded-full" />
                  <Skeleton className="h-2.5 w-4/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-500">{t('notificationsPage.emptyTitle')}</p>
            <p className="text-xs text-gray-400">{t('notificationsPage.emptyDescription')}</p>
            <button onClick={load} className="mt-1 text-xs font-black text-[var(--accent)]">{t('notificationsPage.refresh')}</button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {groups.map((group, gi) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.05 }}
                >
                  {/* Date label */}
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">
                    {group.label}
                  </p>

                  {/* Group card */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-black/[0.05] dark:border-white/[0.06] shadow-sm">
                    {group.items.map((n, i) => {
                      const { icon: Icon, color } = getNotifIcon(n.title)
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => { if (!n.isRead) handleMarkOne(n.id) }}
                          className={cn(
                            'w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors active:bg-gray-50 dark:active:bg-white/5',
                            i !== 0 && 'border-t border-black/[0.04] dark:border-white/[0.04]',
                            !n.isRead ? 'bg-white dark:bg-gray-900' : 'bg-white/60 dark:bg-gray-900/50'
                          )}
                        >
                          {/* Icon */}
                          <div className={cn(
                            'w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5',
                            n.isRead ? 'bg-gray-100 dark:bg-gray-800' : color
                          )}>
                            <Icon className={cn('w-4 h-4', n.isRead ? 'text-gray-400' : 'text-white')} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {(() => {
                              const tr = translateNotification(n.title, n.message, lang)
                              return (
                                <>
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={cn(
                                      'text-[13px] leading-snug',
                                      n.isRead ? 'font-semibold text-gray-500 dark:text-gray-400' : 'font-black text-gray-900 dark:text-white'
                                    )}>
                                      {tr.title}
                                    </p>
                                    {!n.isRead && (
                                      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5 bg-[var(--accent)]" />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                                    {tr.message}
                                  </p>
                                </>
                              )
                            })()}
                            <p className="text-[10px] text-gray-300 dark:text-gray-600 font-semibold mt-1.5 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatNotificationDate(n.createdAt, lang)}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {hasMore && (
              <button
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-3xl bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] text-[12px] font-black text-gray-500 active:scale-[0.98] transition-transform"
              >
                <ChevronDown className="w-4 h-4" />
                {t('parent.showMore')}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                  {notifications.length - visibleCount}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
