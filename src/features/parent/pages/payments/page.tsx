'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { CreditCard, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const CARD = 'rounded-[22px] bg-white/80 dark:bg-slate-900/70 border border-white/80 dark:border-white/[0.07] backdrop-blur-xl'
const SHADOW = '0 2px 8px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.07)'

export default function ParentPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: parentApi.getChildPayments() — backend tayyor bo'lgach ulash
    setTimeout(() => { setLoading(false) }, 800)
  }, [])

  return (
    <DashboardLayout role="PARENT" title="To'lovlar">
      <div className="max-w-2xl mx-auto pb-12 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">To'lovlar</h2>
            <p className="text-[11px] text-slate-400">Farzandingizning to'lov holati</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-[22px] bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
          </div>
        ) : (
          <div className={cn(CARD, 'p-8 text-center')} style={{ boxShadow: SHADOW }}>
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">To'lov ma'lumotlari tez orada</p>
            <p className="text-xs text-slate-300 mt-1">Backend ulangandan so'ng ko'rsatiladi</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
