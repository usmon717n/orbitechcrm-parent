'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const VIEWPORT_SIZE = 320
const OUTPUT_SIZE = 512
const CROP_INSET = 24

interface ImageMetrics {
  width: number
  height: number
  baseScale: number
}

interface Offset {
  x: number
  y: number
}

interface AvatarCropModalProps {
  imageSrc: string | null
  open: boolean
  title: string
  description: string
  zoomLabel: string
  cancelLabel: string
  confirmLabel: string
  processingLabel: string
  onImageError?: () => void
  onClose: () => void
  onConfirm: (blob: Blob) => Promise<void> | void
}

function clampOffset(offset: Offset, metrics: ImageMetrics | null, zoom: number): Offset {
  if (!metrics) return { x: 0, y: 0 }

  const scaledWidth = metrics.width * metrics.baseScale * zoom
  const scaledHeight = metrics.height * metrics.baseScale * zoom
  const maxX = Math.max(0, (scaledWidth - VIEWPORT_SIZE) / 2)
  const maxY = Math.max(0, (scaledHeight - VIEWPORT_SIZE) / 2)

  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  }
}

function createCroppedBlob(
  image: HTMLImageElement,
  metrics: ImageMetrics,
  zoom: number,
  offset: Offset,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not available')
  }

  const displayScale = metrics.baseScale * zoom
  const sourceSize = VIEWPORT_SIZE / displayScale
  const sx = metrics.width / 2 - offset.x / displayScale - sourceSize / 2
  const sy = metrics.height / 2 - offset.y / displayScale - sourceSize / 2

  ctx.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Blob not created'))
        return
      }
      resolve(blob)
    }, 'image/jpeg', 0.92)
  })
}

export default function AvatarCropModal({
  imageSrc,
  open,
  title,
  description,
  zoomLabel,
  cancelLabel,
  confirmLabel,
  processingLabel,
  onImageError,
  onClose,
  onConfirm,
}: AvatarCropModalProps) {
  const [metrics, setMetrics] = useState<ImageMetrics | null>(null)
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !imageSrc) {
      setMetrics(null)
      setImageEl(null)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setDragging(false)
      setLastPoint(null)
      setSubmitting(false)
      return
    }

    const img = new Image()
    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      const baseScale = Math.max(VIEWPORT_SIZE / width, VIEWPORT_SIZE / height)
      setImageEl(img)
      setMetrics({ width, height, baseScale })
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.onerror = () => {
      setMetrics(null)
      setImageEl(null)
      onImageError?.()
    }
    img.src = imageSrc
  }, [imageSrc, onImageError, open])

  if (!open || !imageSrc) return null

  const scaledWidth = metrics ? metrics.width * metrics.baseScale * zoom : VIEWPORT_SIZE
  const scaledHeight = metrics ? metrics.height * metrics.baseScale * zoom : VIEWPORT_SIZE

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!metrics || submitting) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    setLastPoint({ x: event.clientX, y: event.clientY })
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !lastPoint || !metrics) return

    const nextOffset = clampOffset(
      {
        x: offset.x + (event.clientX - lastPoint.x),
        y: offset.y + (event.clientY - lastPoint.y),
      },
      metrics,
      zoom,
    )

    setOffset(nextOffset)
    setLastPoint({ x: event.clientX, y: event.clientY })
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(false)
    setLastPoint(null)
  }

  const handleZoomChange = (value: number) => {
    setZoom(value)
    setOffset((current) => clampOffset(current, metrics, value))
  }

  const handleConfirm = async () => {
    if (!imageEl || !metrics) return
    setSubmitting(true)
    try {
      const blob = await createCroppedBlob(imageEl, metrics, zoom, offset)
      await onConfirm(blob)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-[28px] bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 mx-auto" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="rounded-[28px] bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-5">
            <div
              className="relative mx-auto overflow-hidden rounded-[32px] bg-gray-950 select-none touch-none"
              style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {metrics ? (
                <>
                  <img
                    src={imageSrc}
                    alt="Avatar preview"
                    draggable={false}
                    className="absolute max-w-none pointer-events-none"
                    style={{
                      width: `${scaledWidth}px`,
                      height: `${scaledHeight}px`,
                      left: `calc(50% + ${offset.x}px - ${scaledWidth / 2}px)`,
                      top: `calc(50% + ${offset.y}px - ${scaledHeight / 2}px)`,
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-[32px]" />
                  <div
                    className="absolute left-0 right-0 top-0 pointer-events-none bg-black/30"
                    style={{ height: `${CROP_INSET}px` }}
                  />
                  <div
                    className="absolute left-0 right-0 bottom-0 pointer-events-none bg-black/30"
                    style={{ height: `${CROP_INSET}px` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 left-0 pointer-events-none bg-black/30"
                    style={{ width: `${CROP_INSET}px` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 right-0 pointer-events-none bg-black/30"
                    style={{ width: `${CROP_INSET}px` }}
                  />
                  <div
                    className="absolute pointer-events-none rounded-full border-2 border-white shadow-[0_18px_40px_rgba(15,23,42,0.32)]"
                    style={{
                      inset: `${CROP_INSET}px`,
                    }}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white/90 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{zoomLabel}</label>
              <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              disabled={!metrics || submitting}
              onChange={(event) => handleZoomChange(Number(event.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary flex-1"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!metrics || submitting}
              className="btn-primary flex-1"
            >
              {submitting ? processingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
