'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { TenantFeatures } from '@/lib/tenant-features'

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  isActive: boolean
  features?: TenantFeatures
  maxUsers?: number | null
  maxGroups?: number | null
  trialEndsAt?: string | null
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email?: string
  studentId?: string
  role: 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
  avatar?: string
  isActive: boolean
  features?: TenantFeatures | null
  tenantId?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  tenant: Tenant | null
  setAuth: (user: User, token: string, refreshToken?: string, tenant?: Tenant | null) => void
  setToken: (token: string) => void
  setTenant: (tenant: Tenant | null) => void
  logout: () => void
}

export const AUTH_STORAGE_KEY = 'auth-storage'
export const AUTH_STORAGE_MODE_KEY = 'auth-storage-mode'

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function memoryStorage(): BrowserStorage {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
}

function getAuthStorage(): BrowserStorage {
  if (typeof window === 'undefined') return memoryStorage()
  return sessionStorage.getItem(AUTH_STORAGE_MODE_KEY) === 'session'
    ? sessionStorage
    : localStorage
}

function readPersistedAuthRaw(): string | null {
  if (typeof window === 'undefined') return null
  const storage = getAuthStorage()
  const raw = storage.getItem(AUTH_STORAGE_KEY)
  if (raw || sessionStorage.getItem(AUTH_STORAGE_MODE_KEY) === 'session') return raw
  return localStorage.getItem(AUTH_STORAGE_KEY)
}

/**
 * localStorage dan SINXRON o'qish.
 * Faqat client side da chaqirilishi kerak (useEffect yoki event handler ichida).
 */
export function readAuthFromStorage(): {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  tenant: Tenant | null
} {
  try {
    const raw = readPersistedAuthRaw()
    if (!raw) return { user: null, token: null, isAuthenticated: false, tenant: null }
    const parsed = JSON.parse(raw)
    const state = parsed?.state
    if (!state?.token || !state?.user) return { user: null, token: null, isAuthenticated: false, tenant: null }
    return {
      user: state.user as User,
      token: state.token as string,
      isAuthenticated: true,
      tenant: (state.tenant as Tenant) ?? null,
    }
  } catch {
    return { user: null, token: null, isAuthenticated: false, tenant: null }
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      tenant: null,
      setAuth: (user, token, refreshToken, tenant) =>
        set((state) => ({
          user,
          token,
          refreshToken: refreshToken ?? state.refreshToken ?? null,
          isAuthenticated: true,
          tenant:
            tenant !== undefined
              ? ((tenant && user.tenantId && tenant.id !== user.tenantId) ? null : tenant)
              : (state.tenant?.id && user.tenantId && state.tenant.id === user.tenantId
                ? state.tenant
                : null),
        })),
      setToken: (token) => set({ token }),
      setTenant: (tenant) => set({ tenant }),
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false, tenant: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      version: 1,
      migrate: (persistedState: any, version: number) => {
        return persistedState as AuthState
      },
      storage: createJSONStorage(() => {
        return getAuthStorage()
      }),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tenant: state.tenant,
      }),
    }
  )
)
