'use client'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isPulling: boolean
  isRefreshing: boolean
  isReady: boolean
}

export default function PullToRefreshIndicator({
  pullDistance,
  isPulling,
  isRefreshing,
  isReady,
}: PullToRefreshIndicatorProps) {
  if (!isPulling && !isRefreshing) return null

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[60] flex items-center justify-center"
      style={{
        height: `${Math.max(pullDistance, 0)}px`,
        transition: isRefreshing ? 'height 0.2s ease-out' : 'none',
      }}
    >
      <motion.div
        animate={{
          rotate: isRefreshing ? 360 : isReady ? 180 : 0,
          scale: isReady || isRefreshing ? 1 : 0.7,
        }}
        transition={{
          rotate: isRefreshing
            ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
            : { type: 'spring', stiffness: 300, damping: 22 },
          scale: { type: 'spring', stiffness: 300, damping: 22 },
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10"
        style={{ opacity: Math.min(pullDistance / 40, 1) }}
      >
        <RefreshCw
          className="h-5 w-5"
          style={{ color: isReady || isRefreshing ? 'var(--accent)' : '#94a3b8' }}
          strokeWidth={2.5}
        />
      </motion.div>
    </div>
  )
}
