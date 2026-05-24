import { io, Socket } from 'socket.io-client'

// API URL dan /api prefiksini olib, WebSocket uchun root URL ni ishlatamiz
const WS_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '')

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(token: string): Socket {
  if (socket) {
    // Token yangilansa auth ni ham yangilaymiz
    (socket.auth as Record<string, string>).token = token
    if (!socket.connected) socket.connect()
    return socket
  }

  socket = io(WS_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  })

  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
