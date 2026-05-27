const ROLE_TO_SUBDOMAIN: Record<string, string> = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
  SUPERADMIN: 'superadmin',
}

const PANEL_LABELS = new Set(['admin', 'teacher', 'student', 'parent', 'superadmin'])

export const THIS_PANEL_ROLE = 'PARENT' as const

export interface AuthHandoffPayload {
  access_token: string
  refresh_token?: string | null
  user: Record<string, unknown>
  tenant?: Record<string, unknown> | null
}

function encodeBase64UrlJson(value: unknown): string {
  const json = JSON.stringify(value)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function configuredBaseFor(role: string): string {
  if (typeof process === 'undefined') return ''
  const env = process.env as Record<string, string | undefined>
  switch (role) {
    case 'ADMIN': return (env.NEXT_PUBLIC_ADMIN_PANEL_URL || env.NEXT_PUBLIC_ADMIN_URL || '').trim().replace(/\/+$/, '')
    case 'TEACHER': return (env.NEXT_PUBLIC_TEACHER_PANEL_URL || env.NEXT_PUBLIC_TEACHER_URL || '').trim().replace(/\/+$/, '')
    case 'STUDENT': return (env.NEXT_PUBLIC_STUDENT_PANEL_URL || env.NEXT_PUBLIC_STUDENT_URL || '').trim().replace(/\/+$/, '')
    case 'PARENT': return (env.NEXT_PUBLIC_PARENT_PANEL_URL || env.NEXT_PUBLIC_PARENT_URL || '').trim().replace(/\/+$/, '')
    case 'SUPERADMIN': return (env.NEXT_PUBLIC_SUPERADMIN_PANEL_URL || env.NEXT_PUBLIC_SUPERADMIN_URL || '').trim().replace(/\/+$/, '')
    default: return ''
  }
}

function deriveBaseFromOrigin(origin: string, targetSubdomain: string): string {
  if (!origin) return ''
  try {
    const url = new URL(origin)
    const labels = url.hostname.split('.')
    for (let i = 0; i < labels.length; i++) {
      if (PANEL_LABELS.has(labels[i])) {
        labels[i] = targetSubdomain
        url.hostname = labels.join('.')
        return url.origin.replace(/\/+$/, '')
      }
    }
  } catch {
    return ''
  }
  return ''
}

export function buildCrossPanelHandoffUrl(role: string, payload: AuthHandoffPayload): string | null {
  const subdomain = ROLE_TO_SUBDOMAIN[role]
  if (!subdomain) return null
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = configuredBaseFor(role) || deriveBaseFromOrigin(origin, subdomain)
  if (!base) return null
  const encoded = encodeBase64UrlJson(payload)
  return `${base}/auth/impersonate#payload=${encoded}`
}
