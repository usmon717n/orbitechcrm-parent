import { notificationsApi } from '@/lib/api'

const PUSH_PROMPT_STORAGE_KEY = 'push-notification-prompted-v1'
let inFlight: Promise<void> | null = null

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function subscribeInternal(askPermission: boolean) {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const keyRes = await notificationsApi.getPushPublicKey().catch(() => null)
  const enabled = Boolean(keyRes?.data?.enabled)
  const publicKey = String(keyRes?.data?.publicKey || '')
  if (!enabled || !publicKey) return

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

  let permission = Notification.permission
  if (permission === 'default' && askPermission) {
    permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      localStorage.setItem(PUSH_PROMPT_STORAGE_KEY, '1')
      return
    }
  }

  if (permission !== 'granted') return

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const serialized = subscription.toJSON()
  const endpoint = String(serialized.endpoint || '').trim()
  const p256dh = String(serialized.keys?.p256dh || '').trim()
  const auth = String(serialized.keys?.auth || '').trim()
  if (!endpoint || !p256dh || !auth) return

  await notificationsApi.subscribePush({
    endpoint,
    keys: { p256dh, auth },
  })

  localStorage.setItem(PUSH_PROMPT_STORAGE_KEY, '1')
}

export function setupPushNotifications(options?: { askPermission?: boolean }) {
  const askPermission = options?.askPermission === true

  if (typeof window === 'undefined') return Promise.resolve()
  if (!('Notification' in window)) return Promise.resolve()
  if (Notification.permission === 'denied') return Promise.resolve()

  if (!askPermission && localStorage.getItem(PUSH_PROMPT_STORAGE_KEY) === '1') {
    return Promise.resolve()
  }

  if (inFlight) return inFlight
  inFlight = subscribeInternal(askPermission)
    .catch(() => {})
    .finally(() => {
      inFlight = null
    })

  return inFlight
}
