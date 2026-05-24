'use client'

import { AlertTriangle, Info, ShieldAlert, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

type ConfirmTone = 'danger' | 'accent' | 'warning'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  processingLabel?: string
  confirming?: boolean
  tone?: ConfirmTone
  zIndexClassName?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  processingLabel,
  confirming = false,
  tone = 'accent',
  zIndexClassName = 'z-[90]',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !confirming && open) {
        // Prevent accidental multiple submissions
        onConfirm()
      }
    }
    window.addEventListener('keydown', handleEsc)
    window.addEventListener('keydown', handleEnter)
    return () => {
      window.removeEventListener('keydown', handleEsc)
      window.removeEventListener('keydown', handleEnter)
    }
  }, [open, onCancel, onConfirm, confirming])

  const iconConfig = {
    danger: { icon: ShieldAlert, bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-500' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-500' },
    accent: { icon: Info, bg: 'bg-[var(--accent-subtle)]', text: 'text-[var(--accent)]' },
  }

  const { icon: Icon, bg, text } = iconConfig[tone]

  const confirmBtnClass = tone === 'danger' 
    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
    : tone === 'warning'
    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
    : 'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] shadow-[0_12px_28px_var(--accent-glow)]'

  return (
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 flex items-center justify-center p-4", zIndexClassName)}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-[1.25rem] shadow-2xl overflow-hidden p-5"
          >
            <div className="flex gap-4">
               <div className={cn("w-10 h-10 rounded-xl shrink-0 flex items-center justify-center", bg, text)}>
                  <Icon className="w-5 h-5" />
               </div>
               
               <div className="flex-1 space-y-1.5 pt-0.5">
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {description}
                    </p>
                  )}
               </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
               <button
                  type="button"
                  onClick={onCancel}
                  disabled={confirming}
                  className="h-10 px-4 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all active:scale-95 disabled:opacity-50"
               >
                  {cancelLabel}
               </button>
               <button
                  type="button"
                  autoFocus
                  onClick={onConfirm}
                  disabled={confirming}
                  className={cn(
                    "h-10 px-5 rounded-xl text-sm font-black transition-all active:scale-95 shadow-lg flex items-center gap-2",
                    confirmBtnClass,
                    confirming && "opacity-80"
                  )}
               >
                  {confirming && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {confirming ? (processingLabel || confirmLabel) : confirmLabel}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
