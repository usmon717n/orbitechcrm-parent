'use client'
import { useEffect, useState } from 'react'
import { X, Brain, TrendingUp, Zap, Target, Shield, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { aiDataApi } from '@/lib/api'
import { useSocketEvent } from '@/hooks/useSocketEvent'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

type Period = 'weekly' | 'monthly'

interface DiffBreakdown { correct: number; total: number }
interface Scores { focus: number; stress: number; motivation: number; consistency: number; confidence: number }
interface ScoreData {
  student: { userId: string; studentId: string; name: string; xp: number; level: number }
  period: Period
  dataPoints: {
    lessons: number
    homeworks: number
    quizAttempts: number
    difficultyBreakdown: { easy: DiffBreakdown; medium: DiffBreakdown; hard: DiffBreakdown }
  }
  scores: Scores
}

const SCORES = [
  {
    key: 'focus' as keyof Scores,
    label: 'Diqqat',
    icon: Target,
    color: '#6366f1',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    ring: 'ring-indigo-200 dark:ring-indigo-700/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    desc: 'Darsga qatnashish sifati, vazifalarni o\'z vaqtida topshirish va o\'rta darajali savollardagi to\'g\'rilik.',
    hints: { high: 'Darsda to\'liq ishtirok etmoqda', mid: 'Diqqatda ba\'zi tebranishlar bor', low: 'Darsga e\'tibor pasaygan' },
  },
  {
    key: 'motivation' as keyof Scores,
    label: 'Motivatsiya',
    icon: Zap,
    color: '#f59e0b',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    ring: 'ring-amber-200 dark:ring-amber-700/40',
    text: 'text-amber-700 dark:text-amber-300',
    desc: 'Qiyin savollarga urinish, testlarga qatnashish, qayta tekshirish so\'rash va ball o\'sishi.',
    hints: { high: 'O\'rganishga kuchli intilish bor', mid: 'Motivatsiya o\'rtacha', low: 'Motivatsiya pasaygan, rag\'batlantirishga muhtoj' },
  },
  {
    key: 'consistency' as keyof Scores,
    label: 'Izchillik',
    icon: TrendingUp,
    color: '#10b981',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    ring: 'ring-emerald-200 dark:ring-emerald-700/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    desc: 'Muntazam qatnashish, uzluksiz vazifa topshirish va barqaror natijalar.',
    hints: { high: 'Juda barqaror va tartibli', mid: 'Ba\'zida uzilishlar bor', low: 'Tartibsiz, uzilishlar ko\'p' },
  },
  {
    key: 'confidence' as keyof Scores,
    label: 'Ishonch',
    icon: Shield,
    color: '#3b82f6',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    ring: 'ring-blue-200 dark:ring-blue-700/40',
    text: 'text-blue-700 dark:text-blue-300',
    desc: 'Qiyin savollarda muvaffaqiyat, og\'irlik bilan o\'lchangan test natijalari va XP o\'sishi.',
    hints: { high: 'O\'ziga ishonchi kuchli', mid: 'Ishonch rivojlanmoqda', low: 'O\'z imkoniyatiga ishonmayapti' },
  },
  {
    key: 'stress' as keyof Scores,
    label: 'Stress',
    icon: Brain,
    color: '#ef4444',
    bg: 'bg-red-50 dark:bg-red-900/20',
    ring: 'ring-red-200 dark:ring-red-700/40',
    text: 'text-red-700 dark:text-red-300',
    desc: 'Qoldirilgan darslar, topshirilmagan vazifalar, kechikkan topshiriqlar va o\'z vaqtida yordam kerakmi.',
    hints: { high: 'Jiddiy psixologik bosim', mid: 'Ba\'zi stressli belgilar', low: 'Xotirjam holat' },
    inverted: true,
  },
]

function getLevel(val: number, inverted = false): 'high' | 'mid' | 'low' {
  const v = inverted ? 100 - val : val
  if (v >= 72) return 'high'
  if (v >= 42) return 'mid'
  return 'low'
}

function getStatusColor(val: number, inverted = false) {
  const v = inverted ? 100 - val : val
  if (v >= 72) return 'text-emerald-600 dark:text-emerald-400'
  if (v >= 42) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function getBarColor(val: number, inverted = false) {
  const v = inverted ? 100 - val : val
  if (v >= 72) return '#10b981'
  if (v >= 42) return '#f59e0b'
  return '#ef4444'
}

function AccBadge({ correct, total, label }: { correct: number; total: number; label: string }) {
  if (total === 0) return <span className="text-[10px] text-gray-400 dark:text-gray-600">—</span>
  const pct = Math.round((correct / total) * 100)
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-400">
      <span className="text-gray-400 dark:text-gray-500 font-normal">{label}</span>
      {correct}/{total}
      <span className="text-gray-400 dark:text-gray-600">·</span>
      {pct}%
    </span>
  )
}

export default function StudentScoresModal({
  userId,
  studentName,
  onClose,
}: {
  userId: string
  studentName: string
  onClose: () => void
}) {
  const [period, setPeriod] = useState<Period>('monthly')
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    aiDataApi
      .getStudentScores(userId, period)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [userId, period])

  useSocketEvent<{ userId: string; scores: Scores }>('scores:updated', (payload) => {
    if (payload.userId !== userId) return
    setData((prev) => prev ? { ...prev, scores: payload.scores } : prev)
  }, [userId])

  const radarData = data
    ? SCORES.map((m) => ({
        subject: m.label,
        value: m.inverted ? Math.max(0, 100 - data.scores[m.key]) : data.scores[m.key],
        fullMark: 100,
      }))
    : []

  const overall = data
    ? Math.round(
        SCORES.reduce((sum, m) => {
          const v = m.inverted ? 100 - data.scores[m.key] : data.scores[m.key]
          return sum + v
        }, 0) / SCORES.length,
      )
    : 0

  const overallLabel = overall >= 72 ? 'Yaxshi holat' : overall >= 42 ? "O'rta holat" : 'Diqqat talab qiladi'
  const overallColor = overall >= 72 ? 'text-emerald-600 dark:text-emerald-400' : overall >= 42 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
  const overallRing = overall >= 72 ? 'ring-emerald-400/30' : overall >= 42 ? 'ring-amber-400/30' : 'ring-red-400/30'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-950 rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden max-h-[96dvh] flex flex-col">

        {/* ── Header ── */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
                Psixologik holat
              </p>
              <h2 className="font-bold text-gray-900 dark:text-white text-[17px] truncate">{studentName}</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Period switcher */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/80 text-[11px] font-semibold">
                {(['weekly', 'monthly'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 transition-colors ${
                      period === p
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {p === 'weekly' ? '7 kun' : '30 kun'}
                  </button>
                ))}
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-4 sm:pb-0">
          {loading ? (
            <div className="p-5 space-y-3">
              <div className="h-44 bg-gray-100 dark:bg-gray-800/60 rounded-2xl animate-pulse" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Brain className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Ma'lumot topilmadi</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Bu davr uchun yetarli ma'lumot yo'q</p>
            </div>
          ) : (
            <div className="p-5 space-y-5">

              {/* ── Overall + Radar ── */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Umumiy holat</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className={`text-3xl font-black ${overallColor}`}>{overall}</span>
                      <span className="text-sm text-gray-400 dark:text-gray-500">/ 100</span>
                    </div>
                    <p className={`text-xs font-semibold mt-0.5 ${overallColor}`}>{overallLabel}</p>
                  </div>
                  <div className={`h-16 w-16 rounded-2xl ring-4 ${overallRing} flex items-center justify-center`}
                    style={{ background: `conic-gradient(${overall >= 72 ? '#10b981' : overall >= 42 ? '#f59e0b' : '#ef4444'} ${overall * 3.6}deg, #f3f4f6 0deg)` }}>
                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-gray-950 flex items-center justify-center">
                      <span className={`text-sm font-black ${overallColor}`}>{overall}</span>
                    </div>
                  </div>
                </div>

                {/* Radar */}
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                      <PolarGrid stroke="currentColor" className="text-gray-200 dark:text-gray-700/60" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 10, fontWeight: 600, fill: 'currentColor' }}
                        className="text-gray-500 dark:text-gray-400"
                      />
                      <Radar
                        name="Ball"
                        dataKey="value"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={{ fill: '#6366f1', r: 3 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Difficulty breakdown */}
                {(data.dataPoints.difficultyBreakdown.easy.total > 0 ||
                  data.dataPoints.difficultyBreakdown.medium.total > 0 ||
                  data.dataPoints.difficultyBreakdown.hard.total > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Test savollari (qiyinlik bo'yicha)</p>
                    <div className="flex flex-wrap gap-1.5">
                      <AccBadge correct={data.dataPoints.difficultyBreakdown.easy.correct} total={data.dataPoints.difficultyBreakdown.easy.total} label="Oson" />
                      <AccBadge correct={data.dataPoints.difficultyBreakdown.medium.correct} total={data.dataPoints.difficultyBreakdown.medium.total} label="O'rta" />
                      <AccBadge correct={data.dataPoints.difficultyBreakdown.hard.correct} total={data.dataPoints.difficultyBreakdown.hard.total} label="Qiyin" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Score cards ── */}
              <div className="space-y-2">
                {SCORES.map((m) => {
                  const raw = data.scores[m.key]
                  const display = m.inverted ? Math.max(0, 100 - raw) : raw
                  const level = getLevel(raw, m.inverted)
                  const Icon = m.icon
                  const isOpen = expanded === m.key

                  return (
                    <div
                      key={m.key}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ring-1 ${m.ring} ${m.bg} border-transparent`}
                    >
                      {/* Row */}
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : m.key)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        {/* Icon */}
                        <div
                          className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: m.color + '20' }}
                        >
                          <Icon size={15} style={{ color: m.color }} strokeWidth={2.5} />
                        </div>

                        {/* Label + bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[13px] font-bold ${m.text}`}>{m.label}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-semibold ${getStatusColor(raw, m.inverted)}`}>
                                {m.hints[level]}
                              </span>
                              <span className="text-sm font-black text-gray-800 dark:text-gray-200 w-8 text-right">
                                {raw}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-black/[0.06] dark:bg-white/[0.07] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${raw}%`, backgroundColor: getBarColor(raw, m.inverted) }}
                            />
                          </div>
                        </div>

                        {/* Expand */}
                        <div className="shrink-0 text-gray-400 dark:text-gray-600 ml-1">
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div className="px-4 pb-3.5 pt-0">
                          <div className="flex items-start gap-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] px-3 py-2.5">
                            <Info size={12} className="shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
                            <p className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-400">
                              {m.desc}
                            </p>
                          </div>
                          {m.key === 'stress' && raw >= 60 && (
                            <p className="mt-2 text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                              O'quvchi bilan suhbat o'tkazish tavsiya qilinadi
                            </p>
                          )}
                          {m.key === 'motivation' && raw < 40 && (
                            <p className="mt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Rag'batlantirish va ko'proq e'tibor zarur
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ── Footer meta ── */}
              <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/60 px-4 py-2.5">
                <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
                  <span>{data.dataPoints.lessons} dars</span>
                  <span className="h-3 w-px bg-gray-200 dark:bg-gray-700" />
                  <span>{data.dataPoints.homeworks} vazifa</span>
                  <span className="h-3 w-px bg-gray-200 dark:bg-gray-700" />
                  <span>{data.dataPoints.quizAttempts} test</span>
                </div>
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                  {period === 'weekly' ? 'Oxirgi 7 kun' : 'Oxirgi 30 kun'}
                </span>
              </div>

              {/* Teacher-only notice */}
              <p className="text-center text-[10px] text-gray-300 dark:text-gray-700 pb-1">
                Bu ma'lumotlar faqat o'qituvchi va administrator uchun
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
