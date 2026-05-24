export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024

export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'

export const AVATAR_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export function isAllowedAvatarMime(type: string): boolean {
  return AVATAR_ALLOWED_MIME_TYPES.has(type)
}

export function getApiErrorMessage(err: any, fallback: string): string {
  const raw = err?.response?.data?.message
  if (Array.isArray(raw)) return raw.join(', ')
  if (typeof raw === 'string' && raw.trim().length > 0) return raw
  return fallback
}

