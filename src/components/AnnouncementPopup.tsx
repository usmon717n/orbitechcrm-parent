'use client'
import { useEffect, useState } from 'react'
import { announcementsApi } from '@/lib/api'
import { X, Paperclip, ChevronRight, Megaphone, ZoomIn } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import ImageLightbox from './ImageLightbox'

interface Announcement {
  id: string
  title: string
  description: string | null
  images: string[]
  fileUrl: string | null
  fileOriginalName: string | null
  isBlocking: boolean
}

export default function AnnouncementPopup() {
  const [list, setList] = useState<Announcement[]>([])
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [marking, setMarking] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await announcementsApi.getUnread({ signal: controller.signal })
        if (res.data?.length > 0) {
          setList(res.data)
          setOpen(true)
        }
      } catch (err: any) {
        // Timeout, cancel yoki network xatosi — popup kritik emas, jimgina o'tamiz
        const isSilent = err?.code === 'ERR_CANCELED' ||
          err?.code === 'ECONNABORTED' ||
          err?.message?.includes('timeout')
        if (!isSilent) {
          console.error('AnnouncementPopup load failed:', err?.message)
        }
      }
    }
    load()
    return () => controller.abort()
  }, [])

  if (!open || list.length === 0) return null

  const current = list[index]
  const isLast = index === list.length - 1

  const handleNext = async () => {
    setMarking(true)
    try {
      await announcementsApi.markRead(current.id)
      if (isLast) {
        setOpen(false)
      } else {
        setIndex(index + 1)
      }
    } catch (err) {
      console.error('Failed to mark read:', err)
      if (isLast) setOpen(false)
      else setIndex(index + 1)
    } finally {
      setMarking(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {list.length > 1 ? `E'lon (${index + 1}/${list.length})` : "Yangi e'lon"}
              </h3>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
          {/* Images */}
          {current.images.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
               <div className="grid grid-cols-1 gap-1">
                 {current.images.map((src, i) => (
                   <div 
                     key={i} 
                     className={cn(
                       "relative cursor-zoom-in group",
                       i > 0 && "hidden" // Only show first image in preview
                     )}
                     onClick={() => setSelectedImage(src)}
                   >
                     <img src={src} alt="" className="w-full h-auto max-h-80 object-cover transition-transform duration-500 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 bg-white/20 backdrop-blur-md p-3 rounded-full text-white transform scale-90 group-hover:scale-100 transition-all">
                           <ChevronRight className="w-6 h-6 rotate-[-45deg]" />
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
               {current.images.length > 1 && (
                 <button 
                   onClick={() => setSelectedImage(current.images[0])}
                   className="w-full bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2.5 text-center text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                 >
                   {`+${current.images.length - 1} ta rasm ko'rish`}
                 </button>
               )}
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
              {current.title}
            </h2>
            {current.description && (
              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                {current.description}
              </div>
            )}
          </div>

          {/* File */}
          {current.fileUrl && (
            <a 
              href={current.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-3 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                <Paperclip className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{current.fileOriginalName || 'Fayl'}</p>
                <p className="text-[10px] opacity-70">Biriktirilgan hujjat</p>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-6">
          <button
            onClick={handleNext}
            disabled={marking}
            className="w-full btn-primary h-12 flex items-center justify-center gap-2 text-base shadow-lg shadow-orange-500/25"
          >
            {marking ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>{isLast ? "O'qidim, yopish" : "Keyingisi"}</span>
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {selectedImage && (
        <ImageLightbox 
          src={selectedImage} 
          images={current.images} 
          onClose={() => setSelectedImage(null)} 
        />
      )}
    </div>
  )
}

