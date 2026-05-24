'use client'
import { useEffect, useRef } from 'react'
import { sessionsApi } from '@/lib/api'

const HEARTBEAT_INTERVAL_MS = 60_000 // 60 seconds

/**
 * Tracks student active session time by sending periodic heartbeats to the backend.
 * Heartbeats are recorded at most once per minute on the server.
 */
export function useSessionTracker(enabled = true) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return

    const sendHeartbeat = () => {
      if (document.hidden) return
      sessionsApi.heartbeat().catch(() => {})
    }

    // Send first heartbeat immediately on mount
    sendHeartbeat()

    // Send heartbeat every 60 seconds
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

    // When tab becomes visible again after being hidden, send heartbeat right away
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        sendHeartbeat()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled])
}
