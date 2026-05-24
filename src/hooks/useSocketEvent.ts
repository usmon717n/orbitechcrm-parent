'use client'
import { useEffect } from 'react'
import { getSocket } from '@/lib/socket'

// Socket event'larini listen qilish uchun universal hook.
// Socket hali ulanmagan bo'lsa ham listener ro'yxatdan o'tadi —
// socket.io-client event handler'larni connection'dan mustaqil saqlaydi.
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
  deps: React.DependencyList = [],
) {
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    socket.on(event, handler as (...args: unknown[]) => void)
    return () => {
      socket.off(event, handler as (...args: unknown[]) => void)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps])
}
