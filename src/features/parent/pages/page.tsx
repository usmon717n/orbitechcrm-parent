'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, studentsApi, complaintsApi } from '@/lib/api'
import { cn, uzShort } from '@/lib/utils'
import { translateDayShort } from '@/lib/groups'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '@/components/Skeleton'
import UserAvatar from '@/components/UserAvatar'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { useAuthStore } from '@/store/auth.store'
import { getSocket } from '@/lib/socket'
import {
  CheckCircle2, XCircle, Clock, TrendingUp, CreditCard,
  BookOpen, Calendar, ChevronRight, AlertTriangle, Star,
  GraduationCap, Coins, Plus, X, Timer, ChevronLeft, ChevronRight as ChevronRightIcon,
  LogIn, LogOut, Activity, Zap, MessageSquareWarning,
} from 'lucide-react'

type HomeworkStatus = 'PENDING' | 'SUBMITTED' | 'CHECKED'
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'
type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL'

interface Session { start: string; end: string; minutes: number }
interface DetailData {
  summary: { totalMinutes: number; sessionCount: number; avgSessionMinutes: number; longestSessionMinutes: number }
  sessions: Session[]
  dailyBreakdown: { date: string; minutes: number }[]
  hourlyActivity: number[]
  period: string
  date: string
}

function fmtMin(m: number) {
  if (m === 0) return '0 min'
  const h = Math.floor(m / 60); const min = m % 60
  if (h > 0 && min > 0) return `${h}s ${min}d`
  if (h > 0) return `${h} soat`
  return `${min} daqiqa`
}

function getLocalDateKey(d = new Date()) {
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

interface ChildData {
  childUserId?: string
  student: {
    firstName: string; lastName: string; avatar?: string
    studentId?: string; level: number; xp: number; coins: number
  }
  groups: {
    id: string; name: string; subject: string; schedule?: string
    monthlyFee: number
    teacher: { firstName: string; lastName: string; avatar?: string } | null
    stats: { attendancePct: number | null; hwDone: number; hwTotal: number }
  }[]
  attendance: {
    totalLessons: number; presentCount: number; lateCount: number
    absentCount: number; attendancePct: number | null
    recent: { date: string; status: AttendanceStatus; groupName: string }[]
  }
  payments: {
    totalDebt: number; unpaidCount: number
    list: {
      id: string; groupName: string; amount: number
      month: number; year: number; status: PaymentStatus; paidAt?: string
    }[]
  }
  homework: {
    totalSubmitted: number; doneCount: number
    list: {
      id: string; title: string; groupName: string; dueDate: string
      maxScore: number; score?: number; status: HomeworkStatus
      submittedAt: string; feedback?: string
    }[]
  }
}

function AttendanceDot({ status }: { status: AttendanceStatus }) {
  return (
    <div className={cn(
      'w-2.5 h-2.5 rounded-full flex-shrink-0',
      status === 'PRESENT' && 'bg-emerald-500',
      status === 'LATE' && 'bg-amber-400',
      status === 'ABSENT' && 'bg-red-400',
    )} />
  )
}

function StatusBadge({ status, t }: { status: HomeworkStatus; t: (k: string) => string }) {
  const cfg = {
    PENDING:   { key: 'parent.statusPending',   cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
    SUBMITTED: { key: 'parent.statusSubmitted',  cls: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    CHECKED:   { key: 'parent.statusChecked',    cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
  }[status]
  return <span className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full', cfg.cls)}>{t(cfg.key)}</span>
}

function PaymentBadge({ status, t }: { status: PaymentStatus; t: (k: string) => string }) {
  const cfg = {
    PAID:    { key: 'parent.paymentPaid',    cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    UNPAID:  { key: 'parent.paymentUnpaid',  cls: 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400' },
    PARTIAL: { key: 'parent.paymentPartial', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  }[status]
  return <span className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full', cfg.cls)}>{t(cfg.key)}</span>
}

function parseSchedule(raw: string | undefined, t: (key: string) => string): string {
  if (!raw) return ''
  try {
    const slots: { day: string; time: string }[] = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(slots) || !slots.length) return ''
    const days = slots.map(s => translateDayShort(s.day, t)).join(', ')
    return `${days} • ${slots[0].time}`
  } catch { return '' }
}

const MONTH_NAMES_UZ = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const MONTH_NAMES_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const COMPLAINT_CATEGORY_LABELS: Record<string, string> = {
  BEHAVIOR:   "Xulq-atvor muammosi",
  UNPREPARED: "Darsga tayyorlanmagan",
  DISTRACTED: "Darsda e'tiborsiz",
  PHONE:      "Telefon ishlatdi",
  LATE:       "Kech keldi / erta ketdi",
  DISRUPTIVE: "Boshqalarga xalaqit berdi",
  OTHER:      "Boshqa",
}

interface ComplaintItem {
  id: string
  category: string
  description?: string | null
  createdAt: string
  teacher: { user: { firstName: string; lastName: string } }
  group: { name: string }
  lesson?: { date: string } | null
}

type WidgetType = 'groups' | 'attendance' | 'payments' | 'homework' | 'time'

interface TimeData {
  totalMinutes: number; activeDays: number; avgMinutes: number; maxMinutes: number
  totalDisplay: string; avgDisplay: string; maxDisplay: string
  recent: { date: string; totalMinutes: number; display: string }[]
}

export default function ParentDashboard() {
  const { t, lang } = useI18n()
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<ChildData | null>(null)
  const [loading, setLoading] = useState(true)

  const [activeWidgets, setActiveWidgets] = useState<WidgetType[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [timeData, setTimeData] = useState<TimeData | null>(null)
  const [isChildOnline, setIsChildOnline] = useState(false)
  const [showTimeDetail, setShowTimeDetail] = useState(false)
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [showComplaintsModal, setShowComplaintsModal] = useState(false)

  const MONTH_NAMES = lang === 'ru' ? MONTH_NAMES_RU : lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_UZ

  useEffect(() => {
    api.get('/parents/me')
      .then(res => {
        setData(res.data)
        if (res.data?.childUserId) {
          const s = getSocket()
          if (s) s.emit('presence:watch-user', { userId: res.data.childUserId })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    studentsApi.getMyChildTime()
      .then(res => setTimeData(res.data))
      .catch(() => {})
    complaintsApi.getMyChild()
      .then(res => setComplaints(res.data))
      .catch(() => {})

    const s = getSocket()
    if (s) {
      const handler = ({ isOnline }: { userId: string; isOnline: boolean }) => setIsChildOnline(isOnline)
      s.on('presence:user-status', handler)
      return () => { s.off('presence:user-status', handler) }
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const key = `parent_dashboard_widgets_${user.id}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try { setActiveWidgets(JSON.parse(saved)) } catch { setActiveWidgets(['groups', 'attendance', 'payments', 'homework']) }
    } else {
      setActiveWidgets(['time', 'groups', 'attendance', 'payments', 'homework'])
    }
  }, [user?.id])

  const saveWidgets = (widgets: WidgetType[]) => {
    setActiveWidgets(widgets)
    if (user?.id) localStorage.setItem(`parent_dashboard_widgets_${user.id}`, JSON.stringify(widgets))
  }
  const addWidget = (type: WidgetType) => { if (!activeWidgets.includes(type)) saveWidgets([...activeWidgets, type]); setShowAddModal(false) }
  const removeWidget = (type: WidgetType) => saveWidgets(activeWidgets.filter((w) => w !== type))

  const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

  const availableWidgets: { type: WidgetType; label: string; icon: any }[] = [
    { type: 'time', label: t('parent.timeWidget', 'Tizimda vaqt'), icon: Timer },
    { type: 'groups', label: t('parent.groups'), icon: GraduationCap },
    { type: 'attendance', label: t('parent.attendance30'), icon: Calendar },
    { type: 'payments', label: t('parent.payments'), icon: CreditCard },
    { type: 'homework', label: t('parent.homework'), icon: BookOpen },
  ]

  return (
    <DashboardLayout role="PARENT" title={t('parent.myChild')} >
      {loading ? (
        <div className="space-y-4 pb-10">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <p className="text-sm font-semibold text-gray-500">{t('parent.dataError')}</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 pb-10 max-w-lg mx-auto">

          {/* ── HERO CARD ── */}
          <motion.div variants={fadeUp}>
            <div className="relative overflow-hidden rounded-3xl p-5" style={{ background: 'var(--accent)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10 pointer-events-none" />
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
              <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-white/5 rounded-full" />

              <div className="relative flex items-center gap-4">
                <UserAvatar
                  avatar={data.student.avatar}
                  firstName={data.student.firstName}
                  lastName={data.student.lastName}
                  size="lg"
                  className="ring-4 ring-white/30 shadow-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-white/70 text-xs font-semibold mb-0.5">{t('parent.myChild')}</p>
                  <p className="text-white font-black text-lg leading-tight">
                    {data.student.lastName} {data.student.firstName}
                  </p>
                  {data.student.studentId && (
                    <p className="text-white/60 text-xs font-mono mt-0.5">{data.student.studentId}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/20">
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{t('parent.level')}</p>
                    <p className="text-white font-black text-2xl leading-none">{data.student.level}</p>
                  </div>
                </div>
              </div>

              {/* XP bar */}
              <div className="relative mt-4 space-y-1.5">
                <div className="flex justify-between text-[11px] text-white/70 font-semibold">
                  <span>{data.student.xp} XP</span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3" />{data.student.coins} {t('parent.coin')}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/80 transition-all"
                    style={{ width: `${Math.max(0, Math.min((data.student.xp % 100), 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── QUICK STATS ── */}
          <motion.div variants={fadeUp}>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: t('parent.attendance'),
                  value: data.attendance.attendancePct != null ? `${data.attendance.attendancePct}%` : '—',
                  icon: TrendingUp,
                  color: 'text-emerald-500',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                },
                {
                  label: t('parent.tasks'),
                  value: `${data.homework.doneCount}/${data.homework.totalSubmitted}`,
                  icon: BookOpen,
                  color: 'text-blue-500',
                  bg: 'bg-blue-50 dark:bg-blue-950/30',
                },
                {
                  label: t('parent.debt'),
                  value: data.payments.totalDebt > 0 ? `${data.payments.totalDebt.toLocaleString()}` : t('parent.noDebt'),
                  icon: CreditCard,
                  color: data.payments.totalDebt > 0 ? 'text-red-500' : 'text-emerald-500',
                  bg: data.payments.totalDebt > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30',
                },
              ].map((stat) => (
                <div key={stat.label} className={cn('rounded-2xl p-3 flex flex-col gap-2', stat.bg)}>
                  <stat.icon className={cn('w-4 h-4', stat.color)} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none">{stat.label}</p>
                    <p className={cn('text-lg font-black leading-tight mt-0.5', stat.color)}>{stat.value}</p>
                  </div>
                </div>
              ))}
              {/* Shikoyatlar card */}
              <button
                onClick={() => setShowComplaintsModal(true)}
                className={cn(
                  'rounded-2xl p-3 flex flex-col gap-2 text-left active:scale-[0.97] transition-transform',
                  complaints.length > 0 ? 'bg-orange-50 dark:bg-orange-950/30' : 'bg-gray-50 dark:bg-gray-800/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <MessageSquareWarning className={cn('w-4 h-4', complaints.length > 0 ? 'text-orange-500' : 'text-gray-400')} />
                  {complaints.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                      {complaints.length > 9 ? '9+' : complaints.length}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none">{t('parent.complaints')}</p>
                  <p className={cn('text-lg font-black leading-tight mt-0.5', complaints.length > 0 ? 'text-orange-500' : 'text-gray-400')}>
                    {complaints.length > 0 ? `${complaints.length} ${t('parent.complaintsCount')}` : t('parent.complaintsNone')}
                  </p>
                </div>
              </button>
            </div>
          </motion.div>

          {/* WIDGETS */}
          <div className="space-y-4 pt-2">
            {activeWidgets.map((widgetType) => {

              if (widgetType === 'time') return (
                <div key="time" className="group relative">
                  <button onClick={() => removeWidget('time')} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                  <SectionCard title={t('parent.timeWidget', 'Tizimda vaqt')} icon={Timer}>
                    <div className="space-y-3">
                      {/* Online status + bugungi vaqt */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2.5 h-2.5 rounded-full', isChildOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600')} />
                          <span className={cn('text-sm font-bold', isChildOnline ? 'text-emerald-600' : 'text-gray-400')}>
                            {isChildOnline ? t('parent.online') : t('parent.offline')}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('parent.today')}</p>
                          <p className="text-lg font-black text-violet-600">
                            {timeData?.recent[0]?.date === getLocalDateKey()
                              ? timeData.recent[0].display
                              : '0 min'}
                          </p>
                        </div>
                      </div>
                      {/* Stats qatori */}
                      {timeData && (
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: t('parent.timePeriodAll'), value: timeData.totalDisplay, color: 'text-violet-600' },
                            { label: t('parent.average'),       value: timeData.avgDisplay,   color: 'text-emerald-600' },
                            { label: t('parent.timeActiveDays'),value: String(timeData.activeDays), color: 'text-orange-500' },
                          ].map(s => (
                            <div key={s.label} className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-2 text-center">
                              <p className={cn('text-sm font-black', s.color)}>{s.value}</p>
                              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Batafsil tugmasi */}
                      <button
                        onClick={() => setShowTimeDetail(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 text-xs font-bold hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        {t('parent.viewDetails')}
                      </button>
                    </div>
                  </SectionCard>
                </div>
              )

              if (widgetType === 'groups') return (
                <div key="groups" className="group/widget relative">
                  <button onClick={() => removeWidget('groups')} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full shadow-lg opacity-0 group-hover/widget:opacity-100 transition-all hover:scale-110 z-10 text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>

                  {data.groups.length === 0 ? (
                    <SectionCard title={t('parent.groups')} icon={GraduationCap}>
                      <p className="text-[11px] text-gray-500 text-center py-2">{t('parent.noData', "Ma'lumot yo'q")}</p>
                    </SectionCard>
                  ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-black/[0.05] dark:border-white/[0.06] shadow-sm">
                      {/* Header */}
                      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-black/[0.05] dark:border-white/[0.05]">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
                          <GraduationCap className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white">{t('parent.groups')}</h3>
                      </div>

                      {/* Group rows */}
                      {data.groups.map((g, i) => {
                        const attColor = g.stats.attendancePct == null ? 'text-gray-400'
                          : g.stats.attendancePct >= 75 ? 'text-emerald-600'
                          : g.stats.attendancePct >= 50 ? 'text-amber-500'
                          : 'text-red-500'
                        return (
                          <div key={g.id} className={cn('px-4 py-4', i !== 0 && 'border-t border-black/[0.04] dark:border-white/[0.04]')}>
                            {/* Top row: avatar + name + fee */}
                            <div className="flex items-center gap-3 mb-3">
                              <UserAvatar
                                avatar={g.teacher?.avatar}
                                firstName={g.teacher?.firstName}
                                lastName={g.teacher?.lastName}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-black text-gray-900 dark:text-white truncate">{g.name}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                  {g.teacher ? `${g.teacher.lastName} ${g.teacher.firstName}` : g.subject}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[12px] font-black text-gray-800 dark:text-gray-200 tabular-nums">
                                  {g.monthlyFee.toLocaleString()}
                                </p>
                                <p className="text-[9px] text-gray-400 uppercase tracking-wide">{t('parent.sumMonth')}</p>
                              </div>
                            </div>

                            {/* Mini stats row */}
                            <div className="grid grid-cols-3 gap-2">
                              {/* Davomat */}
                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl px-2.5 py-2 flex flex-col gap-0.5">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{t('parent.attendance')}</p>
                                <p className={cn('text-sm font-black tabular-nums', attColor)}>
                                  {g.stats.attendancePct != null ? `${g.stats.attendancePct}%` : '—'}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl px-2.5 py-2 flex flex-col gap-0.5">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{t('parent.tasks')}</p>
                                <p className="text-sm font-black text-blue-600 tabular-nums">
                                  {g.stats.hwDone}/{g.stats.hwTotal}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl px-2.5 py-2 flex flex-col gap-0.5">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{t('parent.schedule')}</p>
                                <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 leading-tight truncate">
                                  {parseSchedule(g.schedule, t) || '—'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )

              if (widgetType === 'attendance') return (
                <div key="attendance" className="group relative">
                  <button onClick={() => removeWidget('attendance')} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                  <SectionCard title={t('parent.attendance30')} icon={Calendar}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: t('parent.present'), count: data.attendance.presentCount, color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
                          { label: t('parent.late'),    count: data.attendance.lateCount,    color: 'text-amber-600 dark:text-amber-400',   dot: 'bg-amber-400' },
                          { label: t('parent.absent'),  count: data.attendance.absentCount,  color: 'text-red-500 dark:text-red-400',       dot: 'bg-red-400' },
                        ].map(item => (
                          <div key={item.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5">
                            <p className={cn('text-2xl font-black', item.color)}>{item.count}</p>
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <div className={cn('w-1.5 h-1.5 rounded-full', item.dot)} />
                              <p className="text-[10px] text-gray-500 font-semibold">{item.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {data.attendance.recent.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">{t('parent.recentLessons')}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.attendance.recent.map((a, i) => (
                              <div key={i} className="group relative">
                                <AttendanceDot status={a.status} />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                                  <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap font-medium shadow-lg">
                                    {uzShort(a.date)} — {a.groupName}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>
              )

              if (widgetType === 'payments') return (
                <div key="payments" className="group relative">
                  <button onClick={() => removeWidget('payments')} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                  <SectionCard
                    title={t('parent.payments')}
                    icon={CreditCard}
                    badge={data.payments.totalDebt > 0 ? (
                      <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                        {data.payments.totalDebt.toLocaleString()} {t('parent.debtSuffix')}
                      </span>
                    ) : undefined}
                  >
                    {data.payments.list.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">{t('parent.noPayments')}</p>
                    ) : (
                      <div className="space-y-2">
                        {data.payments.list.map(p => (
                          <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                            <div className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                              p.status === 'PAID' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'
                            )}>
                              {p.status === 'PAID'
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                : <XCircle className="w-4 h-4 text-red-400" />
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{p.groupName}</p>
                              <p className="text-[11px] text-gray-400">{MONTH_NAMES[p.month - 1]} {p.year}</p>
                            </div>
                            <div className="text-right shrink-0 space-y-0.5">
                              <p className="text-sm font-black text-gray-900 dark:text-white">{p.amount.toLocaleString()} {t('parent.sum')}</p>
                              <PaymentBadge status={p.status} t={t} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>
              )

              if (widgetType === 'homework') return (
                <div key="homework" className="group relative">
                  <button onClick={() => removeWidget('homework')} className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                  <SectionCard
                    title={t('parent.homework')}
                    icon={BookOpen}
                    badge={
                      <Link href="/parent/homework" className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] hover:underline">
                        {t('parent.details')} <ChevronRight className="w-3 h-3" />
                      </Link>
                    }
                  >
                    {data.homework.list.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">{t('parent.noTasks')}</p>
                    ) : (
                      <div className="space-y-2">
                        {data.homework.list.map(h => (
                          <div key={h.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">{h.title}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{h.groupName}</p>
                              </div>
                              <StatusBadge status={h.status} t={t} />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Clock className="w-3 h-3" />
                                {uzShort(h.dueDate)}
                              </div>
                              {h.score != null && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-400" />
                                  <span className="text-xs font-black text-gray-700 dark:text-gray-200">
                                    {h.score}/{h.maxScore}
                                  </span>
                                </div>
                              )}
                            </div>
                            {h.feedback && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 italic border-l-2 border-[var(--accent)]/40 pl-2">
                                {h.feedback}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>
              )

              return null
            })}

            <div className="flex justify-center pt-5">
              <button
                onClick={() => setShowAddModal(true)}
                className="group relative flex items-center gap-3 px-6 py-2.5 rounded-full overflow-hidden transition-all hover:scale-[1.02] hover:-translate-y-px active:scale-[0.96]"
              >
                {/* Glass Layers */}
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/10 to-[var(--accent)]/5 backdrop-blur-md" />
                <div className="absolute inset-0 border border-[var(--accent)]/20 rounded-full" />
                
                {/* Content */}
                <div className="relative flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/20 shadow-sm border border-[var(--accent)]/30">
                    <Plus className="h-4 w-4 text-[var(--accent)]" strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.2em]">{t('dashboard.addWidget', 'Vidget qo\'shish')}</span>
                </div>
              </button>
            </div>
          </div>

        </motion.div>
      )}

      {/* COMPLAINTS MODAL */}
      <AnimatePresence>
        {showComplaintsModal && (
          <ComplaintsModal complaints={complaints} onClose={() => setShowComplaintsModal(false)} t={t} />
        )}
      </AnimatePresence>

      {/* TIME DETAIL MODAL */}
      <AnimatePresence>
        {showTimeDetail && (
          <TimeDetailModal onClose={() => setShowTimeDetail(false)} isOnline={isChildOnline} />
        )}
      </AnimatePresence>

      {/* WIDGET ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-[320px] bg-white dark:bg-gray-950 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-400" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{t('dashboard.addWidget', 'Vidget qo\'shish')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-2 space-y-1">
              {availableWidgets.map((w) => {
                const Icon = w.icon; const isActive = activeWidgets.includes(w.type)
                return (
                  <button key={w.type} disabled={isActive} onClick={() => addWidget(w.type)} className={cn("group w-full flex items-center gap-4 p-3 rounded-2xl transition-all", isActive ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95")}>
                    <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)]"><Icon className="w-5 h-5" /></div>
                    <div className="flex-1 text-left"><p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{w.label}</p></div>
                    {!isActive && <Plus className="w-4 h-4 text-gray-400" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// ─── Time Detail Modal ────────────────────────────────────────────────────────
type Period = 'day' | 'week' | 'month' | 'overall'

function TimeDetailModal({ onClose, isOnline }: { onClose: () => void; isOnline: boolean }) {
  const { t } = useI18n()
  const [period, setPeriod] = useState<Period>('day')
  const [date, setDate] = useState(getLocalDateKey())
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await studentsApi.getMyChildTimeDetail(date, period)
      setDetail(res.data)
    } catch { setDetail(null) } finally { setLoading(false) }
  }, [date, period])

  useEffect(() => { void load() }, [load])

  const shiftDate = (days: number) => {
    const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + days)
    setDate(getLocalDateKey(d))
  }

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'day',     label: t('parent.timePeriodDay') },
    { key: 'week',    label: t('parent.timePeriodWeek') },
    { key: 'month',   label: t('parent.timePeriodMonth') },
    { key: 'overall', label: t('parent.timePeriodAll') },
  ]

  const s = detail?.summary

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="mt-auto bg-white dark:bg-gray-950 rounded-t-[32px] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{t('parent.timeWidget', 'Tizimda vaqt')}</h2>
            <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400')}>
              <span className={cn('w-1.5 h-1.5 rounded-full', isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400')} />
              {isOnline ? t('parent.online') : t('parent.offline')}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 px-4 pt-3">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={cn('flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors',
                period === p.key ? 'bg-violet-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              )}>{p.label}</button>
          ))}
        </div>

        {/* Date nav (faqat kun rejimida) */}
        {period === 'day' && (
          <div className="flex items-center justify-between px-4 pt-2">
            <button onClick={() => shiftDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-black text-gray-700 dark:text-gray-200">{date}</span>
            <button onClick={() => shiftDate(1)} disabled={date >= getLocalDateKey()} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3 pb-8">
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
          ) : !detail || !s ? (
            <p className="text-center text-sm text-gray-400 py-10">{t('parent.noData', "Ma'lumot yo'q")}</p>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Clock,     label: t('parent.timeTotal'),    value: fmtMin(s.totalMinutes),       color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600' },
                  { icon: Zap,       label: period === 'day' ? t('parent.timeSessions') : t('parent.timeActiveDays'), value: String(s.sessionCount), color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' },
                  { icon: Activity,  label: t('parent.timeAvgSession'), value: fmtMin(s.avgSessionMinutes), color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' },
                  { icon: Timer,     label: t('parent.timeLongest'),   value: fmtMin(s.longestSessionMinutes), color: 'bg-orange-50 dark:bg-orange-950/30 text-orange-500' },
                ].map(st => (
                  <div key={st.label} className={cn('rounded-2xl p-3 flex items-center gap-2', st.color.split(' ').slice(0, 2).join(' '))}>
                    <st.icon className={cn('w-4 h-4 shrink-0', st.color.split(' ').slice(2).join(' '))} />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{st.label}</p>
                      <p className={cn('text-base font-black', st.color.split(' ').slice(2).join(' '))}>{st.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sessiyalar ro'yxati (kun rejimi) */}
              {period === 'day' && detail.sessions.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-50 dark:border-gray-800">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('parent.timeSessions')} · {detail.sessions.length}</p>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {detail.sessions.map((sess, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-7 h-7 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
                          <LogIn className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-200 font-mono">{sess.start} → {sess.end}</p>
                        </div>
                        <span className="text-xs font-black text-violet-600 shrink-0">{fmtMin(sess.minutes)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kunlik breakdown (hafta/oy/jami) */}
              {period !== 'day' && detail.dailyBreakdown.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-50 dark:border-gray-800">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('parent.timeByDays')}</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {(() => {
                      const max = Math.max(...detail.dailyBreakdown.map(d => d.minutes), 1)
                      return detail.dailyBreakdown.map(d => (
                        <div key={d.date} className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400 font-mono w-12 shrink-0">{d.date.slice(5)}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${(d.minutes / max) * 100}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 w-12 text-right shrink-0">{fmtMin(d.minutes)}</span>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              )}

              {period === 'day' && detail.sessions.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">{t('parent.timeNoActivity')}</p>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Complaints Modal ─────────────────────────────────────────────────────────
function ComplaintsModal({ complaints, onClose, t }: { complaints: ComplaintItem[]; onClose: () => void; t: (k: string) => string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="mt-auto bg-white dark:bg-gray-950 rounded-t-[32px] overflow-hidden flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{t('parent.complaints')}</h2>
            {complaints.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 text-[10px] font-black">
                {complaints.length} {t('parent.complaintsCount')}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3 pb-10">
          {complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <MessageSquareWarning className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">{t('parent.noComplaints')}</p>
              <p className="text-xs text-gray-300 dark:text-gray-600">{t('parent.noComplaintsDesc')}</p>
            </div>
          ) : (
            complaints.map((c, i) => {
              const teacherName = `${c.teacher.user.lastName} ${c.teacher.user.firstName}`.trim()
              const date = new Date(c.createdAt)
              const dateStr = `${date.getDate()}-${['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'][date.getMonth()]} ${date.getFullYear()}`
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-4 space-y-2.5 border border-orange-100 dark:border-orange-900/30"
                >
                  {/* Category badge + date */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-black text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 px-2.5 py-1 rounded-full leading-none">
                      {COMPLAINT_CATEGORY_LABELS[c.category] ?? c.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold shrink-0 mt-0.5">{dateStr}</span>
                  </div>

                  {/* Teacher + group */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-200 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-orange-600">{teacherName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{teacherName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{c.group.name}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {c.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-orange-300 dark:border-orange-700 pl-3">
                      {c.description}
                    </p>
                  )}
                </motion.div>
              )
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function SectionCard({
  title, icon: Icon, children, badge
}: {
  title: string
  icon: any
  children: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 dark:border-gray-800/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
