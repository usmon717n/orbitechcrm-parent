'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type Point = { x: number; y: number }

interface QuizImagePreviewProps {
  src: string
  label: string
  compact?: boolean
  className?: string
  imageClassName?: string
}

const MIN_SCALE = 1
const MAX_SCALE = 6

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function QuizImagePreview({
  src,
  label,
  compact = false,
  className,
  imageClassName,
}: QuizImagePreviewProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const scaleRef = useRef(1)
  const lastMousePoint = useRef<Point | null>(null)
  const isMouseDown = useRef(false)

  useEffect(() => { scaleRef.current = scale }, [scale])

  useEffect(() => {
    setMounted(true)
  }, [])

  const resetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    scaleRef.current = 1
    lastMousePoint.current = null
    isMouseDown.current = false
  }

  const zoomBy = (delta: number) => {
    setScale((current) => {
      const next = clamp(current + delta, MIN_SCALE, MAX_SCALE)
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
      return next
    })
  }

  const toggleZoom = () => {
    setScale((current) => {
      if (current > 1.01) {
        setOffset({ x: 0, y: 0 })
        return MIN_SCALE
      }
      return 2.4
    })
  }

  useEffect(() => {
    if (!open) return
    resetView()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, src])

  useEffect(() => {
    if (!open) return
    const viewport = viewportRef.current
    if (!viewport) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY < 0 ? 0.18 : -0.18
      setScale((current) => {
        const next = clamp(current + delta, MIN_SCALE, MAX_SCALE)
        if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
        return next
      })
    }

    let lastTouchDist: number | null = null
    let lastTouchCenter: Point | null = null
    let lastSingleTouch: Point | null = null

    const onTouchStart = (event: TouchEvent) => {
      event.preventDefault()
      if (event.touches.length === 2) {
        const a = event.touches[0]
        const b = event.touches[1]
        lastTouchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        lastTouchCenter = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
        lastSingleTouch = null
      } else if (event.touches.length === 1) {
        lastSingleTouch = { x: event.touches[0].clientX, y: event.touches[0].clientY }
        lastTouchDist = null
        lastTouchCenter = null
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      if (event.touches.length === 2) {
        const a = event.touches[0]
        const b = event.touches[1]
        const newDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        const newCenter: Point = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
        if (lastTouchDist !== null && lastTouchCenter !== null) {
          const ratio = newDist / Math.max(lastTouchDist, 1)
          setScale((s) => {
            const next = clamp(s * ratio, MIN_SCALE, MAX_SCALE)
            if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
            return next
          })
          const dx = newCenter.x - lastTouchCenter.x
          const dy = newCenter.y - lastTouchCenter.y
          setOffset((o) => ({ x: o.x + dx, y: o.y + dy }))
        }
        lastTouchDist = newDist
        lastTouchCenter = newCenter
        lastSingleTouch = null
      } else if (event.touches.length === 1 && lastSingleTouch !== null) {
        const newTouch: Point = { x: event.touches[0].clientX, y: event.touches[0].clientY }
        if (scaleRef.current > 1.01) {
          const dx = newTouch.x - lastSingleTouch.x
          const dy = newTouch.y - lastSingleTouch.y
          setOffset((o) => ({ x: o.x + dx, y: o.y + dy }))
        }
        lastSingleTouch = newTouch
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      event.preventDefault()
      if (event.touches.length === 0) {
        lastTouchDist = null
        lastTouchCenter = null
        lastSingleTouch = null
      } else if (event.touches.length === 1) {
        lastSingleTouch = { x: event.touches[0].clientX, y: event.touches[0].clientY }
        lastTouchDist = null
        lastTouchCenter = null
      }
    }

    viewport.addEventListener('wheel', onWheel, { passive: false })
    viewport.addEventListener('touchstart', onTouchStart, { passive: false })
    viewport.addEventListener('touchmove', onTouchMove, { passive: false })
    viewport.addEventListener('touchend', onTouchEnd, { passive: false })
    viewport.addEventListener('touchcancel', onTouchEnd, { passive: false })
    return () => {
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('touchstart', onTouchStart)
      viewport.removeEventListener('touchmove', onTouchMove)
      viewport.removeEventListener('touchend', onTouchEnd)
      viewport.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [open])

  const transform = useMemo(
    () => `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
    [offset.x, offset.y, scale],
  )

  const openPreview = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation()
    setOpen(true)
  }

  return (
    <>
      {compact ? (
        <div
          role="button"
          tabIndex={0}
          onClick={openPreview}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') openPreview(event)
          }}
          className={cn(
            'group/quiz-image inline-flex max-w-full items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-3 py-2 text-left shadow-sm outline-none ring-orange-400 transition hover:border-orange-300 hover:bg-orange-50 hover:shadow-md active:scale-[0.96] focus-visible:ring-2 dark:border-orange-900/50 dark:bg-gray-950/80 dark:hover:bg-orange-900/20',
            className,
          )}
          title={label}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm shadow-orange-500/25">
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 truncate text-xs font-bold text-slate-800 dark:text-slate-100">
            {label}
          </span>
          <span className="shrink-0 text-[11px] font-semibold text-orange-600 dark:text-orange-400">
            Ochish
          </span>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={openPreview}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') openPreview(event)
          }}
          className={cn(
            'group/quiz-image relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 outline-none ring-orange-400 transition active:scale-[0.98] focus-visible:ring-2 dark:border-gray-800 dark:bg-gray-950',
            className,
          )}
          title={label}
        >
          <img
            src={src}
            alt={label}
            className={cn('h-full w-full object-contain', imageClassName)}
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover/quiz-image:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur">
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kattalashtirish</span>
            </span>
          </div>
        </div>
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[220] flex flex-col bg-white text-slate-900 dark:bg-black dark:text-white"
              onClick={() => setOpen(false)}
            >
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6"
              >
                <p className="min-w-0 truncate text-sm font-semibold text-slate-600 dark:text-white/80">{label}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      zoomBy(-0.5)
                    }}
                    disabled={scale <= MIN_SCALE}
                    className="no-pill inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-40 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      zoomBy(0.5)
                    }}
                    disabled={scale >= MAX_SCALE}
                    className="no-pill inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_8px_18px_var(--accent-glow)] transition hover:bg-[var(--accent-hover)] disabled:opacity-40"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      resetView()
                    }}
                    className="no-pill inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setOpen(false)
                    }}
                    className="no-pill inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    aria-label="Yopish"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>

              <div
                ref={viewportRef}
                className="relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden px-2"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => {
                  isMouseDown.current = true
                  lastMousePoint.current = { x: event.clientX, y: event.clientY }
                }}
                onMouseMove={(event) => {
                  if (!isMouseDown.current || !lastMousePoint.current) return
                  if (scaleRef.current > 1.01) {
                    const dx = event.clientX - lastMousePoint.current.x
                    const dy = event.clientY - lastMousePoint.current.y
                    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }))
                  }
                  lastMousePoint.current = { x: event.clientX, y: event.clientY }
                }}
                onMouseUp={() => {
                  isMouseDown.current = false
                  lastMousePoint.current = null
                }}
                onMouseLeave={() => {
                  isMouseDown.current = false
                  lastMousePoint.current = null
                }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex max-h-full max-w-full items-center justify-center"
                >
                  <div
                    onDoubleClick={(event) => {
                      event.stopPropagation()
                      toggleZoom()
                    }}
                    className={cn(
                      'flex max-h-full max-w-full items-center justify-center will-change-transform',
                      scale > 1.01 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
                      'touch-none',
                    )}
                    style={{ transform }}
                  >
                    <img
                      src={src}
                      alt={label}
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                    />
                  </div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 text-center sm:px-6"
              >
                <p className="text-sm font-semibold text-slate-600 dark:text-white/80">{label}</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-white/45">
                  + / - tugmalari, pinch yoki ikki marta bosish bilan kattalashtiring
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
