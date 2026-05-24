'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  src: string
  images: string[]
  onClose: () => void
}

export default function ImageLightbox({ src, images, onClose }: ImageLightboxProps) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [mounted, setMounted] = useState(false)
  const currentIndex = images.indexOf(currentSrc)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextIdx = (currentIndex + 1) % images.length
    setCurrentSrc(images[nextIdx])
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    const prevIdx = (currentIndex - 1 + images.length) % images.length
    setCurrentSrc(images[prevIdx])
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 isolate z-[1000] flex flex-col items-center justify-center bg-black animate-in fade-in duration-300"
        onClick={onClose}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-[210] shadow-2xl backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>

        {images.length > 1 && (
          <>
            <button 
              onClick={prev}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 text-white hover:bg-white/20 transition-all z-[210] backdrop-blur-md"
            >
              <ChevronRight className="w-8 h-8 rotate-180" />
            </button>
            <button 
              onClick={next}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 text-white hover:bg-white/20 transition-all z-[210] backdrop-blur-md"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12" onClick={onClose}>
          <motion.img 
            key={currentSrc}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            src={currentSrc} 
            alt="" 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 transition-all rounded-full shadow-sm",
                  i === currentIndex ? "w-8 bg-white" : "w-2 bg-white/30"
                )} 
              />
            ))}
          </div>
        )}
      </div>
    </AnimatePresence>,
    document.body,
  )
}
