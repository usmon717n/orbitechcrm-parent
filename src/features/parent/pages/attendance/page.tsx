'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'
import {
  CalendarCheck, UserCheck, UserX, Clock,
  AlertTriangle, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { studentsApi } from '@/lib/api'
import { Skeleton } from '@/components/Skeleton'
import { useI18n } from '@/lib/i18n'

interface AttendanceData {
  student: { firstName: string; lastName: string }
  stats: { total: number; present: number; late: number; absent: number; rate: number }
  weeklyData: { name: string; keldi: number; kechikdi: number; qolmadi: number }[]
  recentIssues: {
    id: string
    date: string
    groupName: string
    subject: string
    status: 'LATE' | 'ABSENT'
    absenceReason: 'EXCUSED' | 'UNEXCUSED' | null
    absenceNote: string | null
  }[]
}

export default function ParentAttendancePage() {
  const { t } = useI18n()
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    studentsApi.getMyChildAttendance()
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
  const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  }

  if (loading) return (
    <DashboardLayout role="PARENT" title={t('parent.attendance')}>
      <div className="space-y-5 max-w-lg mx-auto pb-12">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </DashboardLayout>
  )

  if (error || !data) return (
    <DashboardLayout role="PARENT" title={t('parent.attendance')}>
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-sm font-semibold text-gray-500">{t('parent.dataError')}</p>
      </div>
    </DashboardLayout>
  )

  const { stats, recentIssues } = data

  return (
    <DashboardLayout role="PARENT" title={t('parent.attendance')}>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-lg mx-auto pb-12 space-y-4">

        {/* Hero */}
        <motion.div variants={fadeUp} className="bg-white dark:bg-gray-900 rounded-3xl p-4 border border-black/[0.05] dark:border-white/[0.06] shadow-sm">
          <div className="flex items-center gap-3">
            {/* Ring */}
            <div className="relative w-[88px] h-[88px] shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="11" fill="none" />
                <motion.circle
                  cx="50" cy="50" r="42"
                  stroke={stats.rate >= 75 ? '#10B981' : stats.rate >= 50 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="11"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - stats.rate / 100) }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className="text-[15px] font-black text-gray-900 dark:text-white leading-none tabular-nums">{stats.rate}%</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{t('parent.attendance')}</span>
              </div>
            </div>

            {/* 2x2 stats grid */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              {[
                { icon: CalendarCheck, value: stats.total,   label: t('parent.totalLessons'), color: 'text-gray-600 dark:text-gray-300',    bg: 'bg-gray-50 dark:bg-gray-800/50' },
                { icon: UserCheck,     value: stats.present, label: t('parent.presentLabel'), color: 'text-emerald-600',                    bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                { icon: Clock,         value: stats.late,    label: t('parent.lateLabel'),    color: 'text-amber-500',                      bg: 'bg-amber-50 dark:bg-amber-950/30' },
                { icon: UserX,         value: stats.absent,  label: t('parent.absentLabel'),  color: 'text-red-500',                        bg: 'bg-red-50 dark:bg-red-950/30' },
              ].map((s) => (
                <div key={s.label} className={cn('rounded-2xl px-3 py-2.5 flex items-center gap-2', s.bg)}>
                  <s.icon className={cn('w-4 h-4 shrink-0', s.color)} />
                  <div>
                    <p className={cn('text-base font-black leading-none tabular-nums', s.color)}>{s.value}</p>
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Issues */}
        <motion.div variants={fadeUp} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-black/[0.05] dark:border-white/[0.06] shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.05] dark:border-white/[0.05]">
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-gray-900 dark:text-white leading-tight">{t('parent.issuesTitle')}</p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">{t('parent.issuesSubtitle')}</p>
            </div>
          </div>

          {recentIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-gray-500">{t('parent.noIssues')}</p>
              <p className="text-xs text-gray-400 text-center">{t('parent.noIssuesDesc')}</p>
            </div>
          ) : (
            <div>
              {recentIssues.map((issue, i) => (
                <div key={issue.id} className={cn('px-4 py-3.5', i !== 0 && 'border-t border-black/[0.04] dark:border-white/[0.04]')}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                      issue.status === 'ABSENT' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30',
                    )}>
                      {issue.status === 'LATE'
                        ? <Clock className="w-4 h-4 text-amber-500" />
                        : <UserX className="w-4 h-4 text-red-500" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{issue.subject}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{issue.groupName} · {issue.date}</p>
                      {issue.absenceNote && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-snug italic">
                          "{issue.absenceNote}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn(
                        'text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full',
                        issue.status === 'ABSENT'
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
                      )}>
                        {issue.status === 'LATE' ? t('parent.lateLabel') : t('parent.absentLabel')}
                      </span>
                      {issue.absenceReason && (
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full',
                          issue.absenceReason === 'EXCUSED'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        )}>
                          {issue.absenceReason === 'EXCUSED' ? t('parent.excused') : t('parent.unexcused')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>
    </DashboardLayout>
  )
}
