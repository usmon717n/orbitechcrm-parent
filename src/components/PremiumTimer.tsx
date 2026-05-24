'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PremiumTimerProps {
  seconds: number
  className?: string
  isLoading?: boolean
}

const PremiumTimer: React.FC<PremiumTimerProps> = ({ seconds, className, isLoading }) => {
  // Manfiy bo'lsa "-MM:SS" formatida; mutlaq qiymat bilan format qilamiz.
  const abs = Math.abs(seconds)
  const m = String(Math.floor(abs / 60)).padStart(2, '0')
  const s = String(abs % 60).padStart(2, '0')
  const isNegative = seconds < 0

  // States — countdown holatida (musbat) yaqinlashayotganda rang
  const isUrgent = !isNegative && seconds > 0 && seconds <= 10
  const isRedGlow = !isNegative && seconds > 0 && seconds <= 30
  const isWarning = !isNegative && seconds > 0 && seconds <= 60

  if (isLoading) {
    return (
      <div className={cn("relative h-8 w-24 rounded-full bg-slate-900/50 animate-pulse", className)}>
        <div className="absolute inset-0 rounded-full border border-white/5" />
      </div>
    )
  }

  return (
    <div className={cn("relative group select-none touch-none", className)}>
      {/* Background Container with Glassmorphism - Compact Version */}
      <motion.div
        animate={{
          scale: isUrgent || isNegative ? [1, 1.02, 1] : 1,
          borderColor: isNegative
            ? "rgba(239, 68, 68, 0.7)"
            : isUrgent
              ? "rgba(239, 68, 68, 0.4)"
              : isRedGlow
                ? "rgba(239, 68, 68, 0.2)"
                : "rgba(255, 255, 255, 0.08)"
        }}
        transition={{
          scale: { repeat: Infinity, duration: 1, ease: "easeInOut" },
          borderColor: { duration: 0.4 }
        }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors overflow-hidden relative shadow-none backdrop-blur-md",
          isNegative ? "bg-red-700" : "bg-[#0d1117]"
        )}
      >
        {/* Sublte Animated Gradient Movement - Even more subtle */}
        <motion.div 
          animate={{
            x: ["-10%", "10%"],
            y: ["-10%", "10%"],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: isUrgent 
              ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 60%)'
              : isWarning
                ? 'radial-gradient(circle at center, rgba(249, 115, 22, 0.1) 0%, transparent 60%)'
                : 'radial-gradient(circle at center, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
            filter: 'blur(15px)'
          }}
        />

        {/* Live Indicator - Smaller */}
        <div className="relative flex h-1.5 w-1.5 items-center justify-center shrink-0">
          <motion.span 
            animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className={cn(
              "absolute inline-flex h-full w-full rounded-full",
              isRedGlow ? "bg-red-500/50" : isWarning ? "bg-orange-500/50" : "bg-emerald-500/50"
            )}
          />
          <span className={cn(
            "relative inline-flex rounded-full h-1.5 w-1.5",
            isRedGlow ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-emerald-500"
          )} />
        </div>

        {/* Timer Digits - Smaller font */}
        <div className="flex items-center font-mono text-[15px] font-bold tabular-nums tracking-[-0.02em] text-white">
          {isNegative && <span className="mr-0.5 text-white font-black">−</span>}
          <Digit value={m[0]} isUrgent={isUrgent} isWarning={isWarning} isRed={isRedGlow} />
          <Digit value={m[1]} isUrgent={isUrgent} isWarning={isWarning} isRed={isRedGlow} />
          <motion.span 
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-0.5 text-white/20 mb-0.5"
          >
            :
          </motion.span>
          <Digit value={s[0]} isUrgent={isUrgent} isWarning={isWarning} isRed={isRedGlow} />
          <Digit value={s[1]} isUrgent={isUrgent} isWarning={isWarning} isRed={isRedGlow} />
        </div>
      </motion.div>
    </div>
  )
}

const Digit = ({ value, isUrgent, isWarning, isRed }: { value: string; isUrgent: boolean; isWarning: boolean; isRed: boolean }) => {
  return (
    <div className="relative h-5 w-[11px] flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ 
            y: { type: "spring", stiffness: 500, damping: 30 },
            opacity: { duration: 0.1 }
          }}
          className={cn(
            "text-white transition-colors duration-500",
            isUrgent ? "text-red-400" : 
            isRed ? "text-red-300" :
            isWarning ? "text-orange-300" : ""
          )}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export default PremiumTimer
