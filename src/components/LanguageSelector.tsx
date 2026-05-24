'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { value: 'uz' as const, flag: '🇺🇿', name: "O'zbekcha", short: 'UZ' },
  { value: 'ru' as const, flag: '🇷🇺', name: 'Русский',   short: 'RU' },
  { value: 'en' as const, flag: '🇬🇧', name: 'English',   short: 'EN' },
]

export default function LanguageSelector() {
  const { lang, setLang, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = LANGUAGES.find(l => l.value === lang) ?? LANGUAGES[0]

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all duration-200",
          "bg-white/40 dark:bg-white/5 backdrop-blur-xl",
          "border border-white/40 dark:border-white/10 shadow-sm",
          "hover:bg-white/60 dark:hover:bg-white/10",
          isOpen && "ring-2 ring-[var(--accent-ring)] border-[var(--accent-border)]"
        )}
      >
        <span className="text-[18px] leading-none">{current.flag}</span>
        <span className="hidden sm:block text-[11px] font-bold text-gray-700 dark:text-gray-300 tracking-wider">
          {current.short}
        </span>
        <ChevronDown className={cn(
          "w-3 h-3 text-gray-400 transition-transform duration-300",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 6, scale: 0.95, filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute right-0 mt-2.5 w-44 overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 p-1.5"
          >
            {LANGUAGES.map((option, i) => {
              const isActive = lang === option.value
              return (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    if (!isActive) {
                      setLang(option.value)
                      toast.success(t('settings.languageUpdated'))
                    }
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left",
                    isActive
                      ? "bg-[var(--accent-subtle)] dark:bg-[var(--accent)]/10"
                      : "hover:bg-slate-50 dark:hover:bg-white/5"
                  )}
                >
                  <span className="text-[22px] leading-none">{option.flag}</span>
                  <span className={cn(
                    "flex-1 text-[13px] font-bold",
                    isActive
                      ? "text-[var(--accent)]"
                      : "text-slate-700 dark:text-slate-300"
                  )}>
                    {option.name}
                  </span>
                  {isActive && (
                    <motion.div layoutId="lang-check">
                      <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
