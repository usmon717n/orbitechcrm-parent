'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useI18n } from '@/lib/i18n'
import { getTenantFeatureForPath, isTenantFeatureEnabled } from '@/lib/tenant-features'
import { cn } from '@/lib/utils'
import { notificationsApi } from '@/lib/api'
import { useThemeStore } from '@/store/theme.store'
import {
  Home, Users, BookOpen, Bell, Settings, CreditCard, GraduationCap, Star, PlusCircle,
  ClipboardList, FlaskConical, Shield, Clock3, MoreHorizontal, X, BarChart3,
  Landmark, MessageSquareText, LogOut, CheckCheck, ExternalLink, Menu, Sun, Moon,
  Megaphone, Gamepad2, ShoppingBag, TrendingUp
} from 'lucide-react'

interface Notification { id: string; title: string; body: string; isRead: boolean; createdAt: string }
type UnreadCacheEntry = { count: number; fetchedAt: number }
const unreadCache = new Map<string, UnreadCacheEntry>()
const CACHE_TTL = 60_000

interface NavbarProps { role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SUPERADMIN' }

export default function Navbar({ role }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const logout = useAuthStore((s) => s.logout)
  const { t } = useI18n()
  const { theme, setTheme } = useThemeStore()

  const [mounted, setMounted] = useState(false)
  const [maxVisible, setMaxVisible] = useState(10)
  const [moreOpen, setMoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const fetchingRef = useRef(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)

  const adminLinks = [
    { href: '/admin', label: t('nav.home'), icon: Home },
    { href: '/admin/students', label: t('nav.students'), icon: Users },
    { href: '/admin/teachers', label: t('nav.teachers'), icon: GraduationCap },
    { href: '/admin/groups', label: t('nav.groups'), icon: BookOpen },
    { href: '/admin/payments', label: t('nav.payments'), icon: CreditCard },
    { href: '/admin/finance', label: t('nav.finance'), icon: Landmark },
    { href: '/admin/tests', label: t('nav.tests'), icon: FlaskConical },
    { href: '/admin/ratings', label: t('nav.ratings'), icon: Star },
    { href: '/admin/reports', label: t('nav.reports'), icon: BarChart3 },
    { href: '/admin/notifications', label: t('nav.notifications'), icon: Bell },
    { href: '/admin/announcements', label: t('nav.announcements'), icon: Megaphone },
    { href: '/admin/games', label: t('nav.games'), icon: Gamepad2 },
    { href: '/admin/shop', label: t('nav.shop'), icon: ShoppingBag },
    { href: '/admin/statistics', label: t('nav.statistics'), icon: TrendingUp },
    { href: '/admin/support', label: t('nav.support'), icon: MessageSquareText },
    { href: '/admin/audit', label: t('nav.auditLog'), icon: Shield },
    { href: '/admin/settings', label: t('nav.settings'), icon: Settings },
  ]
  const teacherLinks = [
    { href: '/teacher', label: t('nav.home'), icon: Home },
    { href: '/teacher/groups', label: t('nav.myGroups'), icon: BookOpen },
    { href: '/teacher/time', label: t('nav.time'), icon: Clock3 },
    { href: '/teacher/tests', label: t('nav.tests'), icon: FlaskConical },
    { href: '/teacher/notifications', label: t('nav.notifications'), icon: Bell },
    { href: '/teacher/settings', label: t('nav.settings'), icon: Settings },
  ]
  const studentLinks = [
    { href: '/student', label: t('nav.home'), icon: Home },
    { href: '/student/groups', label: t('nav.myGroups'), icon: BookOpen },
    { href: '/student/payments', label: t('nav.myPayments'), icon: CreditCard },
    { href: '/student/homework', label: t('nav.indicators'), icon: ClipboardList },
    { href: '/student/ratings', label: t('nav.ratings'), icon: Star },
    { href: '/student/extra', label: t('nav.extraLessons'), icon: PlusCircle },
    { href: '/student/settings', label: t('nav.settings'), icon: Settings },
  ]

  const parentLinks = [
    { href: '/parent', label: 'Bosh sahifa', icon: Home },
    { href: '/parent/groups', label: 'Guruhlar', icon: BookOpen },
    { href: '/parent/attendance', label: 'Davomat', icon: ClipboardList },
    { href: '/parent/payments', label: "To'lovlar", icon: CreditCard },
    { href: '/parent/homework', label: 'Vazifalar', icon: Star },
    { href: '/parent/notifications', label: 'Xabarlar', icon: Bell },
    { href: '/parent/settings', label: 'Sozlamalar', icon: Settings },
  ]

  const isAllowed = (href: string) => {
    const feature = getTenantFeatureForPath(role, href)
    return feature ? isTenantFeatureEnabled(tenant?.features, feature) && isTenantFeatureEnabled(user?.features, feature) : true
  }

  const allLinks = (role === 'ADMIN' ? adminLinks : role === 'TEACHER' ? teacherLinks : role === 'PARENT' ? parentLinks : studentLinks).filter(l => isAllowed(l.href))
  const isActive = (href: string) => pathname === href || (href !== `/${role.toLowerCase()}` && pathname.startsWith(href))
  const basePath = `/${role.toLowerCase()}`

  useEffect(() => {
    setMounted(true)
    const calc = () => {
      const w = window.innerWidth
      if (w < 768) setMaxVisible(0)
      else if (w < 1024) setMaxVisible(3)
      else if (w < 1280) setMaxVisible(4)
      else if (w < 1440) setMaxVisible(6)
      else setMaxVisible(100)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileOpen])

  useEffect(() => { setMoreOpen(false); setMobileOpen(false); setNotifOpen(false) }, [pathname])

  useEffect(() => {
    if (!user || user.role === 'ADMIN') { setUnread(0); return }
    const cached = unreadCache.get(user.id)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) { setUnread(cached.count); return }
    if (fetchingRef.current) return
    fetchingRef.current = true
    notificationsApi.getUnreadCount()
      .then(res => { const c = Math.max(0, Number((res.data as any)?.count ?? 0)); unreadCache.set(user.id, { count: c, fetchedAt: Date.now() }); setUnread(c) })
      .catch(() => {}).finally(() => { fetchingRef.current = false })
  }, [user?.id, user?.role])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreOpen && moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (mobileOpen && mobileRef.current && !mobileRef.current.contains(e.target as Node)) setMobileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen, notifOpen, mobileOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMoreOpen(false); setNotifOpen(false); setMobileOpen(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const openNotif = useCallback(async () => {
    if (notifOpen) { setNotifOpen(false); return }
    setNotifOpen(true); setNotifLoading(true)
    try {
      const res = await notificationsApi.getMy({ limit: 7 })
      setNotifications(Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [])
    } catch { setNotifications([]) } finally { setNotifLoading(false) }
  }, [notifOpen])

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(p => p.map(n => ({ ...n, isRead: true }))); setUnread(0)
      unreadCache.set(user!.id, { count: 0, fetchedAt: Date.now() })
      window.dispatchEvent(new CustomEvent('notifications:count-changed', { detail: { count: 0 } }))
    } catch {}
  }, [user])

  const timeAgo = (iso: string) => {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (m < 1) return t('notificationsPage.time.now')
    if (m < 60) return t('notificationsPage.time.minutes', { m })
    const h = Math.floor(m / 60)
    if (h < 24) return t('notificationsPage.time.hours', { h })
    return t('notificationsPage.time.days', { d: Math.floor(h / 24) })
  }

  const visibleLinks = allLinks.slice(0, maxVisible)
  const overflowLinks = allLinks.slice(maxVisible)
  const isMoreActive = overflowLinks.some(l => isActive(l.href))

  const Avatar = () => user?.avatar
    ? <img src={user.avatar} alt="av" className="w-full h-full object-cover" />
    : <span className="flex h-full w-full items-center justify-center bg-[var(--accent-subtle)] text-xs font-bold text-[var(--accent)]">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>

  const [bodyOverflow, setBodyOverflow] = useState('')

  useEffect(() => {
    if (typeof document === 'undefined') return
    const observer = new MutationObserver(() => {
      setBodyOverflow(document.body.style.overflow)
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })
    setBodyOverflow(document.body.style.overflow)
    return () => observer.disconnect()
  }, [])

  const isModalOpen = mounted && bodyOverflow === 'hidden' && !mobileOpen

  if (!mounted) return <div className="h-[72px] w-full bg-white/70 dark:bg-[#0f172a]/70 border-b border-slate-200 dark:border-slate-800" />

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-40 h-[72px] bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out shadow-sm",
      isModalOpen && "-translate-y-full opacity-0 pointer-events-none"
    )}>
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">

        {/* LEFT: Logo - SuperAdmin Style */}
        <Link href={basePath} className="flex items-center gap-3 shrink-0 group cursor-pointer relative">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--accent-glow)] blur-xl transition-all duration-500 group-hover:bg-[var(--accent-glow-strong)]" />
            <div className="relative w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_12px_30px_var(--accent-glow)] ring-1 ring-[var(--accent-border)] transform group-hover:scale-105 transition-all duration-500 overflow-hidden p-1">
              <Image src="/logo/image.png" alt="Orbitech Logo" fill className="object-contain" priority />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter leading-none text-slate-900 dark:text-white">
              Orbitech
            </h1>
          </div>
        </Link>

        {/* CENTER: Nav items - SuperAdmin Tab Style */}
        <nav className="hidden md:flex flex-1 items-center justify-center max-w-fit p-1 bg-[var(--accent-subtle)]/50 dark:bg-[var(--accent-subtle)]/20 rounded-2xl backdrop-blur-sm border border-[var(--accent-border)]/10 relative">
          {visibleLinks.map(link => {
            const active = isActive(link.href)
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className="relative flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold transition-all duration-300 outline-none whitespace-nowrap group"
              >
                <motion.div
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "relative z-10 flex items-center gap-2",
                    active ? "text-[var(--accent-foreground)]" : "text-slate-500 group-hover:text-[var(--accent)]"
                  )}
                >
                  <link.icon className={cn("w-4 h-4 transition-transform duration-300", active && "scale-110")} />
                  {link.label}
                </motion.div>

                {active && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-2xl z-0"
                    style={{ 
                      background: 'var(--accent-gradient)',
                      boxShadow: '0 10px 25px var(--accent-glow)' 
                    }}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                
                {/* Hover Pill - The "Motion Harakat" feel */}
                <div className="absolute inset-0 rounded-2xl bg-white/40 dark:bg-slate-800/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-0" />
              </Link>
            )
          })}

          {overflowLinks.length > 0 && (
            <div className="relative" ref={moreRef}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setMoreOpen(v => !v)}
                className={cn(
                  'relative flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold transition-all duration-300 outline-none whitespace-nowrap',
                  isMoreActive || moreOpen ? 'text-[var(--accent-foreground)]' : 'text-slate-500 hover:text-[var(--accent)]'
                )}
              >
                {(isMoreActive && !moreOpen) && (
                  <motion.div 
                    layoutId="nav-active-pill" 
                    className="absolute inset-0 rounded-2xl"
                    style={{ 
                      background: 'var(--accent-gradient)',
                      boxShadow: '0 14px 32px var(--accent-glow)' 
                    }}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.6 }} 
                  />
                )}
                {moreOpen && (
                   <div className="absolute inset-0 rounded-2xl bg-[var(--accent)] opacity-90" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <MoreHorizontal className="w-4 h-4" />
                  {t('nav.more') === 'nav.more' ? "Ko'proq" : (t('nav.more') || "Ko'proq")}
                </span>
              </motion.button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }} 
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }} 
                    exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute top-full right-0 mt-3 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50"
                  >
                    {overflowLinks.map(link => {
                      const active = isActive(link.href)
                      return (
                        <Link key={link.href} href={link.href} onClick={() => setMoreOpen(false)}
                          className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
                            active ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_12px_28px_var(--accent-glow)]'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <link.icon className="w-4 h-4 shrink-0" />
                          <span>{link.label}</span>
                        </Link>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle - Ideal Motion */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden sm:flex p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-[var(--accent)] transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ opacity: 0, rotate: -180, scale: 0.5, filter: 'blur(10px)' }}
                animate={{ opacity: 1, rotate: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, rotate: 180, scale: 0.5, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          {role !== 'ADMIN' && (
            <div ref={notifRef} className="relative">
              <button onClick={openNotif} className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-[var(--accent)] transition-colors border border-slate-200 dark:border-slate-700 shadow-sm relative">
                <Bell className="w-5 h-5" />
                {unread > 0 && <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800">{unread > 9 ? '9+' : unread}</span>}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 top-full mt-3 w-80 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{t('notificationsPage.title')}</span>
                      <div className="flex items-center gap-1">
                        {unread > 0 && <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-[var(--accent)] font-bold px-2 py-1.5 rounded-xl hover:bg-[var(--accent-subtle)] transition-colors"><CheckCheck className="w-4 h-4" />{t('notificationsPage.markAll')}</button>}
                        <button onClick={() => setNotifOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifLoading ? (
                        <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse" />)}</div>
                      ) : notifications.length === 0 ? (
                        <div className="py-12 text-center text-sm text-slate-400 font-medium">{t('notificationsPage.none')}</div>
                      ) : notifications.map(n => (
                        <div key={n.id} className={cn('flex gap-3 px-5 py-4 transition-colors', !n.isRead ? 'bg-[var(--accent-subtle)]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50')}>
                          <div className={cn('w-2 h-2 mt-1.5 rounded-full shrink-0', !n.isRead ? 'bg-[var(--accent)]' : 'bg-slate-300 dark:bg-slate-600')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{n.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">{n.body}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50">
                      <button onClick={() => { setNotifOpen(false); router.push(`${basePath}/notifications`) }} className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] hover:opacity-70 transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5" />{t('notificationsPage.viewAll')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Profile - SuperAdmin Style */}
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden lg:flex flex-col">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user?.firstName}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{role}</p>
            </div>
            <button onClick={() => router.push(`${basePath}/settings`)} className="w-11 h-11 rounded-2xl overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800 hover:ring-[var(--accent)] transition-all shadow-lg shadow-slate-200/50 dark:shadow-none bg-white">
              <Avatar />
            </button>
            <button onClick={() => logout()} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-90 border border-red-100 dark:border-red-900/30">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden relative" ref={mobileRef}>
            <button onClick={() => setMobileOpen(v => !v)} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <AnimatePresence>
              {mobileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }} 
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }} 
                  exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }} 
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-4 z-50"
                >
                  {/* user info */}
                  <div className="flex items-center justify-between p-3 mb-4 bg-slate-50 dark:bg-slate-800/80 rounded-[1.5rem] border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white dark:ring-slate-700 bg-white"><Avatar /></div>
                      <div>
                        <p className="text-base font-bold text-slate-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{role}</p>
                      </div>
                    </div>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 shadow-sm">
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* links grid */}
                  <div className="grid grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                    {allLinks.map(link => {
                      const active = isActive(link.href)
                      return (
                        <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                          className={cn('flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] text-center transition-all duration-300 border',
                            active ? 'bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-[0_16px_36px_var(--accent-glow)]'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                          )}
                        >
                          <link.icon className={cn("w-6 h-6", active ? "text-[var(--accent-foreground)]" : "text-[var(--accent)]")} />
                          <span className="text-[11px] font-bold uppercase tracking-tight leading-tight">{link.label}</span>
                        </Link>
                      )
                    })}
                  </div>

                  {/* logout */}
                  <button onClick={() => { setMobileOpen(false); logout() }}
                    className="mt-4 w-full flex items-center justify-center gap-2 p-4 rounded-[1.5rem] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm border border-red-100 dark:border-red-900/20 active:scale-95 transition-all"
                  >
                    <LogOut className="w-5 h-5" />Chiqish
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
