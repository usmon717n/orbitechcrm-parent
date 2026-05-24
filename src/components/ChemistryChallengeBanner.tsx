'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, CheckCircle2, X } from 'lucide-react'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/auth.store'
import { pendingChemistryMatch } from '@/lib/pendingChemistryMatch'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface IncomingChallenge {
  challengeId: string
  fromUserId: string
  fromFirstName: string
  fromLastName: string
  fromAvatar?: string
}

interface MatchedData {
  playerIdx: 0 | 1
  opponent: { firstName: string; lastName: string; avatar?: string }
}

export default function ChemistryChallengeBanner() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { t } = useI18n()

  const [challenge, setChallenge] = useState<IncomingChallenge | null>(null)
  const [timeLeft, setTimeLeft] = useState(60)
  const [accepting, setAccepting] = useState(false)

  // ─── Socket listener (hamma sahifada ishlaydi) ───────────────────────────────
  useEffect(() => {
    let cleanup: (() => void) | null = null

    const tryAttach = () => {
      const s = getSocket()
      if (!s) return false

      const onIncoming = (data: IncomingChallenge) => {
        setChallenge(data)
        setTimeLeft(60)
        setAccepting(false)
      }
      s.on('chemistry:challenge-incoming', onIncoming)
      cleanup = () => s.off('chemistry:challenge-incoming', onIncoming)
      return true
    }

    if (tryAttach()) return () => cleanup?.()

    const interval = setInterval(() => {
      if (tryAttach()) clearInterval(interval)
    }, 300)

    return () => { clearInterval(interval); cleanup?.() }
  }, [])

  // ─── 60s countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!challenge) return
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); setChallenge(null); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [challenge])

  // ─── Accept / Decline ────────────────────────────────────────────────────────
  const respond = (accept: boolean) => {
    const s = getSocket()
    if (!s || !challenge) return

    s.emit('chemistry:challenge-response', {
      challengeId: challenge.challengeId,
      accept,
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      avatar: user?.avatar,
    })

    if (!accept) {
      setChallenge(null)
      return
    }

    // Qabul qilindi — chemistry:matched kelguncha kut
    setAccepting(true)

    let matched = false
    const onMatched = (data: MatchedData) => {
      if (matched) return
      matched = true
      s.off('chemistry:matched', onMatched)
      clearTimeout(fallback)
      pendingChemistryMatch.set(data)
      setChallenge(null)
      setAccepting(false)
      router.push('/student/chemistry?mode=formula')
    }
    s.on('chemistry:matched', onMatched)

    // 8s fallback — matched kelmasa ham navigate qil
    const fallback = setTimeout(() => {
      if (matched) return
      s.off('chemistry:matched', onMatched)
      setChallenge(null)
      setAccepting(false)
      router.push('/student/chemistry?mode=formula')
    }, 8000)
  }

  return (
    <AnimatePresence>
      {challenge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 80, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 55%, #312e81 100%)' }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-indigo-900/30 pointer-events-none" />

            <div className="relative p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/20">
                  <FlaskConical className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-0.5">{t('chemistry.challengeIncoming')}</p>
                  <p className="text-lg font-black text-white leading-snug truncate">
                    {challenge.fromFirstName} {challenge.fromLastName}
                  </p>
                  <p className="text-sm text-white/60 font-semibold">{t('chemistry.challengeInvite')}</p>
                </div>
              </div>

              {/* Timer bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-white/50">
                  <span>{t('chemistry.challengeDeadline')}</span>
                  <span className={cn('tabular-nums', timeLeft <= 10 ? 'text-red-300' : 'text-white/70')}>{timeLeft}s</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/70 transition-all duration-1000"
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                  />
                </div>
              </div>

              {/* Buttons */}
              {accepting ? (
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span className="text-sm font-black text-white/80">{t('chemistry.challengePreparing')}</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => respond(false)}
                    className="h-12 rounded-2xl bg-white/15 ring-1 ring-white/20 text-sm font-black text-white/80 flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-95"
                  >
                    <X className="w-4 h-4" /> {t('chemistry.challengeDecline')}
                  </button>
                  <button
                    onClick={() => respond(true)}
                    className="h-12 rounded-2xl bg-white text-violet-700 text-sm font-black flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 hover:scale-105"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {t('chemistry.challengeAccept')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
