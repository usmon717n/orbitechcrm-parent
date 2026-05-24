'use client'
import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Area = { x: number; y: number; width: number; height: number }

interface Props {
  imageSrc: string
  aspect?: number
  onConfirm: (blob: Blob) => void
  onCancel: () => void
  title?: string
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })

  // Safe area: large enough to hold the image at any rotation angle
  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  const canvas = document.createElement('canvas')
  canvas.width = safeArea
  canvas.height = safeArea
  const ctx = canvas.getContext('2d')!

  // Rotate around center of safe area
  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  // Extract the cropped region from the rotated canvas
  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y),
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas is empty'))
    }, 'image/jpeg', 0.92)
  })
}

export default function ImageCropModal({ imageSrc, aspect = 1, onConfirm, onCancel, title = 'Rasmni kesish' }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, pixelArea: Area) => {
    setCroppedAreaPixels(pixelArea)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      onConfirm(blob)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#1a1f2e] rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 className="font-black text-gray-900 dark:text-white text-sm">{title}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full" style={{ height: 300 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: 0, background: '#0f0f0f' },
              cropAreaStyle: { border: '2px solid var(--accent)' },
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-3">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
              style={{ background: `linear-gradient(to right, var(--accent) ${((zoom - 1) / 2) * 100}%, #e5e7eb ${((zoom - 1) / 2) * 100}%)` }}
            />
            <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-3">
            <RotateCw className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="range" min={-180} max={180} step={1} value={rotation}
              onChange={e => setRotation(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
              style={{ background: `linear-gradient(to right, var(--accent) ${((rotation + 180) / 360) * 100}%, #e5e7eb ${((rotation + 180) / 360) * 100}%)` }}
            />
            <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">{rotation}°</span>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button onClick={onCancel}
              className="py-3 rounded-2xl font-bold text-sm bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
              Bekor
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing}
              className={cn(
                'py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95',
                processing && 'opacity-70 cursor-not-allowed'
              )}
              style={{ background: 'var(--accent)' }}
            >
              <Check className="w-4 h-4" />
              {processing ? 'Saqlanmoqda...' : 'Tasdiqlash'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
