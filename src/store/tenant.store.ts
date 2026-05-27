'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface TenantState {
  activeSlug: string | null
  setActiveSlug: (slug: string | null) => void
  clear: () => void
}

export const TENANT_STORAGE_KEY = 'tenant-storage'

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeSlug: null,
      setActiveSlug: (slug) => set({ activeSlug: slug ? normalizeSlug(slug) : null }),
      clear: () => set({ activeSlug: null }),
    }),
    {
      name: TENANT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
        }
        return localStorage
      }),
    },
  ),
)

export { normalizeSlug }
