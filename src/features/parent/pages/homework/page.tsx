'use client'
import { useEffect, useState, useMemo } from 'react'
import { useSessionState } from '@/hooks/useSessionState'
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid } from 'recharts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/Skeleton'
import { useI18n } from '@/lib/i18n'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Star,
  TrendingUp, BookOpen, Zap, ChevronDown, ChevronUp,
  Timer, Award, AlertCircle, BarChart3,
} from 'lucide-react'

const MONTH_NAMES_UZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const MONTH_NAMES_RU = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря']
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatDateTime(d: string, lang: 'uz' | 'ru' | 'en') {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  const months = lang === 'ru' ? MONTH_NAMES_RU : lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_UZ
  const day = date.getDate()
  const month = months[date.getMonth()]
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${day} ${month}, ${h}:${m}`
}

function formatShortDate(d: string, lang: 'uz' | 'ru' | 'en') {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  const months = lang === 'ru' ? MONTH_NAMES_RU : lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_UZ
  return `${date.getDate()} ${months[date.getMonth()]}`
}

type HomeworkStatus = 'PENDING' | 'CHECKED' | 'REVISION_NEEDED' | 'RESUBMITTED'

interface Submission {
  id: string; homeworkId: string; title: string
  groupId: string; groupName: string; groupSubject: string
  dueDate: string; maxScore: number
  score?: number; scorePct?: number
  status: HomeworkStatus; isLate: boolean; lateHours: number
  submittedAt: string; checkedAt?: string
  feedback?: string; xpEarned: number
}

interface NotSubmitted {
  id: string; title: string; groupId: string; groupName: string
  groupSubject: string; dueDate: string; maxScore: number
}

interface GroupStat {
  id: string; name: string; subject: string
  total: number; submitted: number; checked: number
  notSubmittedCount: number; lateCount: number
  avgScore: number | null
}

interface HomeworkData {
  summary: {
    totalAssigned: number; submitted: number; notSubmitted: number
    checked: number; avgScore: number | null
    lateCount: number; onTimeCount: number
    scoreBands: { A: number; B: number; C: number; D: number }
  }
  groupStats: GroupStat[]
  submissions: Submission[]
  notSubmitted: NotSubmitted[]
}

function ScoreBar({ pct, size = 'md' }: { pct: number; size?: 'sm' | 'md' }) {
  const color = pct >= 90 ? '#10B981' : pct >= 75 ? '#3B82F6' : pct >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className={cn('w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden', size === 'sm' ? 'h-1' : 'h-1.5')}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

function GradeLetter({ pct }: { pct: number }) {
  const { letter, color } =
    pct >= 90 ? { letter: 'A', color: 'text-emerald-500' } :
    pct >= 75 ? { letter: 'B', color: 'text-blue-500' } :
    pct >= 60 ? { letter: 'C', color: 'text-amber-500' } :
                { letter: 'D', color: 'text-red-500' }
  return <span className={cn('font-black text-lg leading-none', color)}>{letter}</span>
}

function SubmissionCard({ s, t, lang }: { s: Submission; t: (k: string) => string; lang: 'uz'|'ru'|'en' }) {
  const STATUS_CFG: Record<HomeworkStatus, { labelKey: string; color: string; bg: string; barColor: string; icon: any }> = {
    PENDING:         { labelKey: 'parent.hwPending',     color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800/60',       barColor: '#94A3B8', icon: Clock },
    CHECKED:         { labelKey: 'parent.hwChecked',     color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40',    barColor: '#10B981', icon: CheckCircle2 },
    REVISION_NEEDED: { labelKey: 'parent.hwRevision',    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/40',        barColor: '#F59E0B', icon: AlertCircle },
    RESUBMITTED:     { labelKey: 'parent.hwResubmitted', color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/40',          barColor: '#3B82F6', icon: ChevronUp },
  }

  const cfg = STATUS_CFG[s.status]
  const Icon = cfg.icon
  const scoreColor = s.scorePct == null ? '' : s.scorePct >= 90 ? 'text-emerald-600' : s.scorePct >= 75 ? 'text-blue-600' : s.scorePct >= 60 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-black/[0.05] dark:border-white/[0.06] shadow-sm">
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Grade / status icon */}
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', cfg.bg)}>
          {s.scorePct != null
            ? <GradeLetter pct={s.scorePct} />
            : <Icon className={cn('w-4.5 h-4.5', cfg.color)} />
          }
        </div>

        {/* Title + group */}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-gray-900 dark:text-white leading-snug line-clamp-1">{s.title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{s.groupName} · {s.groupSubject}</p>
        </div>

        {/* Score */}
        {s.score != null && (
          <div className="shrink-0 text-right">
            <p className={cn('text-[15px] font-black tabular-nums leading-none', scoreColor)}>{s.score}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">/{s.maxScore}</p>
          </div>
        )}
      </div>

      {/* Score bar */}
      {s.scorePct != null && (
        <div className="px-4 -mt-1 mb-3">
          <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: cfg.barColor }}
              initial={{ width: 0 }}
              animate={{ width: `${s.scorePct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Badges row */}
      <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
          {t(cfg.labelKey)}
        </span>
        {s.isLate && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
            <Timer className="w-2.5 h-2.5" />{s.lateHours}{t('parent.lateHours')}
          </span>
        )}
        {s.xpEarned > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
            <Zap className="w-2.5 h-2.5" />+{s.xpEarned} XP
          </span>
        )}
      </div>

      {/* Date row */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('parent.deadline')}</p>
          <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{formatDateTime(s.dueDate, lang)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('parent.submittedDate')}</p>
          <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{formatDateTime(s.submittedAt, lang)}</p>
        </div>
      </div>

      {/* Feedback */}
      {s.feedback && (
        <div className="mx-4 mb-4 p-3 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] mb-1">{t('parent.teacherNote')}</p>
          <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">{s.feedback}</p>
        </div>
      )}
    </div>
  )
}

function HomeworkProgressChart({ submissions, t, lang }: { submissions: Submission[], t: (k: string, fb?: string) => string, lang: 'uz'|'ru'|'en' }) {
  const [filter, setFilter] = useSessionState<'1W' | '1M' | 'ALL'>('chartFilter', 'ALL')
  
  const filteredSubmissions = useMemo(() => {
    let limit = 0
    if (filter === '1W') limit = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (filter === '1M') limit = Date.now() - 30 * 24 * 60 * 60 * 1000
    
    return submissions
      .filter(s => s.scorePct != null && s.submittedAt && new Date(s.submittedAt).getTime() >= limit)
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
  }, [submissions, filter])

  const chartData = useMemo(() => {
    return filteredSubmissions.map(s => ({
      name: formatShortDate(s.submittedAt, lang),
      score: s.scorePct,
      title: s.title,
    }))
  }, [filteredSubmissions, lang])

  const avgScore = useMemo(() => {
    if (chartData.length === 0) return 0
    const sum = chartData.reduce((acc, curr) => acc + (curr.score || 0), 0)
    return (sum / chartData.length).toFixed(1)
  }, [chartData])

  if (submissions.filter(s => s.scorePct != null).length === 0) return null

  const wText = t('parent.timePeriodWeek')
  const mText = t('parent.timePeriodMonth')
  const allText = t('parent.timePeriodAll')

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-5 sm:p-8 pb-4 sm:pb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent)]/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 relative z-10">
          <div>
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('parent.avgScore', "O'rtacha ball")}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-[2.75rem] font-black text-gray-900 dark:text-white tracking-tighter leading-none">{avgScore}</span>
              <span className="text-lg font-bold text-gray-400">%</span>
            </div>
          </div>
          
          <div className="flex bg-gray-50/80 dark:bg-gray-800/40 p-1.5 rounded-full items-center self-stretch sm:self-auto shadow-inner border border-gray-100 dark:border-gray-800">
            {[
              { id: '1W', num: '1', text: wText },
              { id: '1M', num: '1', text: mText },
              { id: 'ALL', num: '', text: allText }
            ].map(f => {
              const isActive = filter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={cn(
                    "relative flex flex-col items-center justify-center flex-1 sm:flex-none sm:min-w-[4rem] px-2 h-12 rounded-full transition-all duration-300 z-10",
                    isActive ? "text-[var(--accent)]" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  {isActive && (
                    <motion.div layoutId="chart-filter-bg" className="absolute inset-0 bg-white dark:bg-gray-700 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.05)] border border-gray-100 dark:border-gray-600 z-[-1]" />
                  )}
                  {f.num && <span className="text-sm font-black leading-none">{f.num}</span>}
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", f.num ? "mt-0.5" : "")}>{f.text}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="h-[180px] -mx-2 sm:-mx-4 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-gray-800/60" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                dy={10}
                minTickGap={20}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
                tickCount={5}
              />
              <Tooltip 
                cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.5 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl shadow-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{payload[0].payload.name}</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white mb-0.5">{payload[0].payload.title}</p>
                        <p className="text-lg font-black text-[var(--accent)]">{payload[0].value}%</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="var(--accent)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorScore)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--accent)', strokeOpacity: 0.2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}

const PAGE_SIZE = 10

export default function ParentHomeworkPage() {
  const { t, lang } = useI18n()
  const [data, setData] = useState<HomeworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useSessionState<'all' | 'missed'>('tab', 'all')
  const [selectedGroup, setSelectedGroup] = useSessionState<string>('hwGroup', 'all')
  const [visibleSub, setVisibleSub] = useState(PAGE_SIZE)
  const [visibleMissed, setVisibleMissed] = useState(PAGE_SIZE)

  useEffect(() => {
    api.get('/parents/me/homework')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setVisibleSub(PAGE_SIZE)
    setVisibleMissed(PAGE_SIZE)
  }, [selectedGroup, tab])

  const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

  if (loading) return (
    <DashboardLayout role="PARENT" title={t('parent.homework')}>
      <div className="space-y-4 max-w-lg mx-auto pb-10">
        <Skeleton className="h-10 rounded-2xl" />
        <Skeleton className="h-52 rounded-3xl" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    </DashboardLayout>
  )

  if (!data) return (
    <DashboardLayout role="PARENT" title={t('parent.homework')}>
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-sm font-semibold text-gray-500">{t('parent.dataError')}</p>
      </div>
    </DashboardLayout>
  )

  const { groupStats, submissions, notSubmitted } = data

  const filteredSubmissions = selectedGroup === 'all'
    ? submissions
    : submissions.filter(s => s.groupId === selectedGroup)

  const filteredNotSubmitted = selectedGroup === 'all'
    ? notSubmitted
    : notSubmitted.filter(h => h.groupId === selectedGroup)

  const pagedSub    = filteredSubmissions.slice(0, visibleSub)
  const pagedMissed = filteredNotSubmitted.slice(0, visibleMissed)
  const hasMoreSub    = visibleSub    < filteredSubmissions.length
  const hasMoreMissed = visibleMissed < filteredNotSubmitted.length

  return (
    <DashboardLayout role="PARENT" title={t('parent.homework')}>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 max-w-lg mx-auto pb-10">

        {/* ── GROUP FILTER PILLS ── */}
        {groupStats.length > 1 && (
          <motion.div variants={fadeUp}>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedGroup('all')}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all',
                  selectedGroup === 'all'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] text-gray-500'
                )}
              >
                {t('parent.all')}
              </button>
              {groupStats.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g.id)}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all',
                    selectedGroup === g.id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] text-gray-500'
                  )}
                >
                  {g.name}
                  {g.avgScore != null && (
                    <span className={cn(
                      'text-[9px] font-black px-1.5 py-0.5 rounded-full',
                      selectedGroup === g.id
                        ? 'bg-white/20 text-white'
                        : g.avgScore >= 75 ? 'bg-emerald-100 text-emerald-600'
                        : g.avgScore >= 60 ? 'bg-amber-100 text-amber-600'
                        : 'bg-red-100 text-red-500'
                    )}>
                      {g.avgScore}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CHART ── */}
        <HomeworkProgressChart submissions={filteredSubmissions} t={t} lang={lang} />

        {/* ── TAB: Submitted / Missed ── */}
        <motion.div variants={fadeUp}>
          <div className="flex p-1 bg-gray-100/80 dark:bg-gray-900/60 rounded-2xl gap-1">
            {([
              ['all',    t('parent.submittedTab'),    filteredSubmissions.length],
              ['missed', t('parent.notSubmittedTab'), filteredNotSubmitted.length],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all',
                  tab === key ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                )}
              >
                {label}
                <span className={cn(
                  'text-[9px] font-black px-1.5 py-0.5 rounded-full',
                  tab === key ? 'bg-[var(--accent)] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                )}>{count}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── SUBMISSIONS LIST ── */}
        {tab === 'all' && (
          <motion.div variants={fadeUp} className="space-y-2">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">{t('parent.noSubmissions')}</div>
            ) : (
              <>
                {pagedSub.map(s => <SubmissionCard key={s.id} s={s} t={t} lang={lang} />)}
                {hasMoreSub && (
                  <button
                    onClick={() => setVisibleSub(v => v + PAGE_SIZE)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-3xl bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] text-[12px] font-black text-gray-500 active:scale-[0.98] transition-transform"
                  >
                    <ChevronDown className="w-4 h-4" />
                    {t('parent.showMore')}
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                      {filteredSubmissions.length - visibleSub}
                    </span>
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── NOT SUBMITTED LIST ── */}
        {tab === 'missed' && (
          <motion.div variants={fadeUp} className="space-y-2">
            {filteredNotSubmitted.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 text-center">
                <Award className="w-8 h-8 text-emerald-400" />
                <p className="text-sm font-bold text-gray-500">{t('parent.allDone')}</p>
              </div>
            ) : (
              <>
              {pagedMissed.map(h => (
              <div key={h.id} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.05] dark:border-white/[0.06] shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-black text-gray-900 dark:text-white line-clamp-1">{h.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{h.groupName} · {h.groupSubject}</p>
                  <p className="text-[11px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatShortDate(h.dueDate, lang)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-black text-gray-700 dark:text-gray-200 tabular-nums">{h.maxScore}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">{t('parent.points')}</p>
                </div>
              </div>
            ))}
            {hasMoreMissed && (
              <button
                onClick={() => setVisibleMissed(v => v + PAGE_SIZE)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-3xl bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] text-[12px] font-black text-gray-500 active:scale-[0.98] transition-transform"
              >
                <ChevronDown className="w-4 h-4" />
                Ko'proq ko'rish
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
                  {filteredNotSubmitted.length - visibleMissed}
                </span>
              </button>
            )}
            </>
            )}
          </motion.div>
        )}

      </motion.div>
    </DashboardLayout>
  )
}
