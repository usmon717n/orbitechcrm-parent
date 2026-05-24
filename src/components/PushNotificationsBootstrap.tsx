'use client'

import { useEffect } from 'react'
import { setupPushNotifications } from '@/lib/push-notifications'

export default function PushNotificationsBootstrap() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void setupPushNotifications({ askPermission: false })
    }, 1200)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  return null
}
