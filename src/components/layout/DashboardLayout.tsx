'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, readAuthFromStorage, type User } from '@/store/auth.store'
import Navbar from './Navbar'
import SurveyGuard from './SurveyGuard'
import type { Role } from '@/types'
import { translateKnownTitle, useI18n } from '@/lib/i18n'
import { useSessionTracker } from '@/hooks/useSessionTracker'
import { settingsApi } from '@/lib/api'
import { getTenantFeatureForPath, isTenantFeatureEnabled } from '@/lib/tenant-features'
import { Wrench } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: Role
  title?: string
  hideHeader?: boolean
  persistentHeader?: React.ReactNode
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)]">
      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
        <span className="font-brand text-lg tracking-wide">OrbitechCRM</span>
        <div className="w-7 h-7 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

type AuthStatus =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' }

type MaintenanceState = {
  enabled: boolean
  message: string
}

const MAINTENANCE_CACHE_TTL_MS = 30_000
const MAINTENANCE_POLL_MS = 15_000
const MAINTENANCE_EVENT = 'settings:maintenance-changed'
const MAINTENANCE_STORAGE_KEY = 'orbitech-maintenance-state'
const DEFAULT_MAINTENANCE_MESSAGE = 'Bugun texnik ishlar olib borilmoqda'
let maintenanceCache: (MaintenanceState & { fetchedAt: number }) | null = null

function normalizeMaintenanceState(data: any): MaintenanceState {
  return {
    enabled: Boolean(data?.enabled),
    message: String(data?.message || DEFAULT_MAINTENANCE_MESSAGE),
  }
}

function publishMaintenanceState(nextState: MaintenanceState) {
  maintenanceCache = { ...nextState, fetchedAt: Date.now() }
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify({ ...nextState, updatedAt: Date.now() }))
  } catch {
    // localStorage can be unavailable in private/locked contexts.
  }
}

export default function DashboardLayout({ children, role, title, hideHeader = false, persistentHeader }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useI18n()
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ status: 'loading' })
  const [maintenance, setMaintenance] = useState<MaintenanceState>({ enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE })
  const redirected = useRef(false)
  const translatedTitle = translateKnownTitle(title, t)
  const tenant = useAuthStore((s) => s.tenant)

  useSessionTracker(authStatus.status === 'authenticated' && role === 'STUDENT')

  useEffect(() => {
    const { user, isAuthenticated } = readAuthFromStorage()
    if (!isAuthenticated || !user) {
      setAuthStatus({ status: 'unauthenticated' })
      if (!redirected.current) { redirected.current = true; router.replace('/auth/login') }
      return
    }
    if (user.role !== role) {
      setAuthStatus({ status: 'unauthenticated' })
      if (!redirected.current) {
        redirected.current = true
        const path = user.role === 'ADMIN' ? '/admin' : user.role === 'TEACHER' ? '/teacher' : '/student'
        router.replace(path)
      }
      return
    }
    setAuthStatus({ status: 'authenticated', user })
  }, [role, router])

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state.isAuthenticated || !state.user) {
        setAuthStatus({ status: 'unauthenticated' })
        if (!redirected.current) { redirected.current = true; router.replace('/auth/login') }
      } else {
        setAuthStatus({ status: 'authenticated', user: state.user })
      }
    })
    return unsubscribe
  }, [router])

  useEffect(() => {
    if (authStatus.status !== 'authenticated') return

    let cancelled = false
    const applyState = (nextState: MaintenanceState) => {
      if (cancelled) return
      publishMaintenanceState(nextState)
      setMaintenance(nextState)
    }

    const fetchMaintenance = () => {
      settingsApi.getMaintenanceBanner()
        .then((res) => applyState(normalizeMaintenanceState(res.data)))
        .catch(() => {})
    }

    if (maintenanceCache && Date.now() - maintenanceCache.fetchedAt < MAINTENANCE_CACHE_TTL_MS) {
      setMaintenance({ enabled: maintenanceCache.enabled, message: maintenanceCache.message })
    } else {
      fetchMaintenance()
    }

    const intervalId = window.setInterval(fetchMaintenance, MAINTENANCE_POLL_MS)
    const onFocus = () => fetchMaintenance()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchMaintenance()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [authStatus.status])

  useEffect(() => {
    const onMaintenanceChanged = (event: Event) => {
      const nextState = normalizeMaintenanceState((event as CustomEvent).detail)
      publishMaintenanceState(nextState)
      setMaintenance(nextState)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== MAINTENANCE_STORAGE_KEY || !event.newValue) return
      try {
        const nextState = normalizeMaintenanceState(JSON.parse(event.newValue))
        maintenanceCache = { ...nextState, fetchedAt: Date.now() }
        setMaintenance(nextState)
      } catch {
        // Ignore invalid storage payloads from older builds.
      }
    }

    window.addEventListener(MAINTENANCE_EVENT, onMaintenanceChanged)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(MAINTENANCE_EVENT, onMaintenanceChanged)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    if (authStatus.status !== 'authenticated') return
    const feature = getTenantFeatureForPath(role, pathname)
    if (!feature) return
    if (isTenantFeatureEnabled(tenant?.features, feature) && isTenantFeatureEnabled(authStatus.user.features, feature)) return

    const homePath = role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/student'
    router.replace(homePath)
  }, [authStatus, pathname, role, router, tenant?.features])

  if (authStatus.status !== 'authenticated') return <Spinner />
  const requiredFeature = getTenantFeatureForPath(role, pathname)
  if (requiredFeature && (!isTenantFeatureEnabled(tenant?.features, requiredFeature) || !isTenantFeatureEnabled(authStatus.user.features, requiredFeature))) return <Spinner />

  return (
    <div className="panel-pill-ui dashboard-desktop-density flex flex-col min-h-screen min-h-[100dvh] bg-[var(--app-bg)]">
      <Navbar role={role} />

      {/* Asosiy kontent */}
      <div className="flex-1 flex flex-col min-w-0 pt-[72px]">
        <div
          className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
            maintenance.enabled ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'
          }`}
          aria-hidden={!maintenance.enabled}
        >
          <div className="overflow-hidden">
            <div className="max-w-7xl mx-auto w-full px-6">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/85 px-3 py-2 text-center text-xs font-medium text-amber-800 shadow-sm dark:border-amber-900/60 dark:bg-amber-900/25 dark:text-amber-100">
                <Wrench className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
                {maintenance.message}
              </div>
            </div>
          </div>
        </div>
        
        {persistentHeader && (
          <div className="max-w-7xl mx-auto w-full px-6 pt-6 sm:pt-8">
            {persistentHeader}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 20, scale: 0.96, filter: 'blur(15px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 0.96, filter: 'blur(15px)' }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 120,
              mass: 0.8,
              duration: 0.5
            }}
            className="dashboard-main flex-1 max-w-7xl mx-auto w-full px-6 py-6 sm:py-8 space-y-6"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Majburiy so'rovnoma guard — admin uchun ishlamaydi */}
      {role !== 'ADMIN' && <SurveyGuard role={role} />}
    </div>
  )
}
