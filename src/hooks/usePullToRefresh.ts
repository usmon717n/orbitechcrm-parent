'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  // Yetarli torttirish masofasi (px) — bu chegaradan keyin refresh boshlanadi
  threshold?: number
  // Ko'rsatishning maksimal sof'lanishi
  maxPull?: number
  // O'chirish: agar disabled bo'lsa, hech narsa qilmaydi
  disabled?: boolean
}

interface UsePullToRefreshState {
  pullDistance: number
  isPulling: boolean
  isRefreshing: boolean
  isReady: boolean
}

/**
 * Pull-to-refresh — mobile ro'yxatda yuqoridan pastga torttirish bilan
 * ma'lumotni qayta yuklash. Faqat sahifa eng yuqorida bo'lganda ishlaydi.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 70,
  maxPull = 120,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshState {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startYRef = useRef(0)
  const isPullingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => { onRefreshRef.current = onRefresh }, [onRefresh])

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return

    const handleTouchStart = (e: TouchEvent) => {
      // Faqat sahifa eng yuqorida bo'lganda ishlaymiz
      if (window.scrollY > 0) return
      if (isRefreshing) return
      startYRef.current = e.touches[0].clientY
      isPullingRef.current = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return
      if (window.scrollY > 0) {
        isPullingRef.current = false
        setPullDistance(0)
        return
      }
      const currentY = e.touches[0].clientY
      const delta = currentY - startYRef.current
      if (delta <= 0) {
        setPullDistance(0)
        return
      }
      // Rezistanslik effekti — torttirish qarshilik bilan
      const resistance = Math.min(delta * 0.5, maxPull)
      setPullDistance(resistance)
    }

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return
      isPullingRef.current = false
      const distance = pullDistance
      if (distance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(threshold)
        try {
          await onRefreshRef.current()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [disabled, isRefreshing, maxPull, threshold, pullDistance])

  return {
    pullDistance,
    isPulling: pullDistance > 0 && !isRefreshing,
    isRefreshing,
    isReady: pullDistance >= threshold,
  }
}
