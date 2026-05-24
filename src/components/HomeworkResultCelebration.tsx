'use client'

import { CheckCircle2, Sparkles, Trophy, X } from 'lucide-react'

export interface HomeworkResultCelebrationData {
  key: string
  title: string
  score: number
  maxScore: number
  feedback?: string | null
  checkedAt?: string | null
  correctCount?: number | null
  totalQuestions?: number | null
}

interface HomeworkResultCelebrationProps {
  result: HomeworkResultCelebrationData
  onClose: () => void
  t: (key: string, fallback?: string) => string
}

const bursts = [
  { left: '16%', top: '24%', color: '#fb923c', delay: '0ms' },
  { left: '82%', top: '22%', color: '#0EA5A4', delay: '180ms' },
  { left: '24%', top: '72%', color: '#22c55e', delay: '320ms' },
  { left: '76%', top: '68%', color: '#f59e0b', delay: '520ms' },
]

function getResultMood(percent: number, t: HomeworkResultCelebrationProps['t']) {
  if (percent >= 90) {
    return {
      label: t('homeworkCelebration.excellent', "A'lo natija"),
      message: t('homeworkCelebration.excellentMessage', "Zo'r! Shu tempni ushlasangiz, keyingi marralar ham sizniki."),
      color: 'text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    }
  }
  if (percent >= 75) {
    return {
      label: t('homeworkCelebration.good', 'Juda yaxshi'),
      message: t('homeworkCelebration.goodMessage', 'Natija chiroyli. Yana ozgina aniqlik bilan bundan ham yuqoriga chiqasiz.'),
      color: 'text-teal-600 dark:text-teal-400',
      bar: 'bg-[#0EA5A4]',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
    }
  }
  if (percent >= 55) {
    return {
      label: t('homeworkCelebration.keepGoing', 'Yaxshi harakat'),
      message: t('homeworkCelebration.keepGoingMessage', "Asos bor. Xatolarni ko'rib chiqing, keyingi urinishda natija ancha ko'tariladi."),
      color: 'text-amber-600 dark:text-amber-400',
      bar: 'bg-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    }
  }
  return {
    label: t('homeworkCelebration.tryAgain', 'Davom etamiz'),
    message: t('homeworkCelebration.tryAgainMessage', "Bu ham o'sishning bir qismi. Sababini tushunib, keyingi vazifada yaxshiroq natija qilamiz."),
    color: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
  }
}

export default function HomeworkResultCelebration({ result, onClose, t }: HomeworkResultCelebrationProps) {
  const safeMax = result.maxScore > 0 ? result.maxScore : 100
  const percent = Math.max(0, Math.min(100, Math.round((result.score / safeMax) * 100)))
  const mood = getResultMood(percent, t)

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0">
        {bursts.map((burst, burstIndex) => (
          <div
            key={`${burst.left}-${burst.top}`}
            className="homework-firework-burst"
            style={{
              left: burst.left,
              top: burst.top,
              color: burst.color,
              ['--burst-delay' as string]: burst.delay,
            }}
          >
            {Array.from({ length: 12 }).map((_, sparkIndex) => (
              <span
                key={sparkIndex}
                className="homework-firework-spark"
                style={{
                  ['--spark-angle' as string]: `${sparkIndex * 30 + burstIndex * 8}deg`,
                  ['--spark-distance' as string]: `${34 + (sparkIndex % 4) * 8}px`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_24px_80px_-36px_rgba(15,23,42,0.75)] dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label={t('common.close', 'Yopish')}
          >
            <X className="h-4 w-4" />
          </button>

          <div className={`px-5 pb-5 pt-7 text-center ${mood.bg}`}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
              <Trophy className="h-8 w-8" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {t('homeworkCelebration.title', 'Vazifa tekshirildi')}
            </p>
            <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-gray-950 dark:text-white">
              {result.title}
            </h3>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="flex items-end justify-center gap-2">
              <span className={`text-5xl font-black leading-none tracking-tight ${mood.color}`}>
                {result.score}
              </span>
              <span className="pb-1 text-lg font-semibold text-gray-400">/ {safeMax}</span>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className={mood.color}>{mood.label}</span>
                <span className="text-gray-500 dark:text-gray-400">{percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className={`h-full rounded-full ${mood.bar} transition-all duration-700`} style={{ width: `${percent}%` }} />
              </div>
            </div>

            {result.correctCount != null && result.totalQuestions != null && result.totalQuestions > 0 && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800/70 dark:text-gray-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {result.correctCount}/{result.totalQuestions} {t('homeworkCelebration.correctAnswers', "to'g'ri javob")}
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              <div className="mb-2 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {t('homeworkCelebration.motivation', 'Motivatsiya')}
              </div>
              <p>{mood.message}</p>
            </div>

            {result.feedback && (
              <p className="rounded-2xl border-l-4 border-[#0EA5A4] bg-teal-50 px-4 py-3 text-sm italic text-teal-900 dark:bg-teal-950/30 dark:text-teal-100">
                &quot;{result.feedback}&quot;
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-2xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
            >
              {t('homeworkCelebration.closeButton', 'Tushunarli')}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .homework-firework-burst {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          animation: homework-burst-pulse 1700ms var(--burst-delay) ease-out infinite;
        }

        .homework-firework-spark {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 5px;
          height: 5px;
          border-radius: 9999px;
          background: currentColor;
          opacity: 0;
          transform: rotate(var(--spark-angle)) translateY(0) scale(0.45);
          animation: homework-spark 1700ms var(--burst-delay) ease-out infinite;
          box-shadow: 0 0 18px currentColor;
        }

        @keyframes homework-burst-pulse {
          0%, 15% { opacity: 0; transform: scale(0.3); }
          20% { opacity: 1; transform: scale(1); }
          80%, 100% { opacity: 0; transform: scale(1.2); }
        }

        @keyframes homework-spark {
          0%, 18% {
            opacity: 0;
            transform: rotate(var(--spark-angle)) translateY(0) scale(0.45);
          }
          24% {
            opacity: 1;
          }
          78%, 100% {
            opacity: 0;
            transform: rotate(var(--spark-angle)) translateY(calc(var(--spark-distance) * -1)) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
