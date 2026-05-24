'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileText,
  Sparkles,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { paymentsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

type VerifyResult = {
  valid: boolean
  receiptNumber: string
  receiptUrl?: string | null
  paidAt?: string | null
  amount?: number
  paymentMethod?: string | null
  allocation?: {
    transaction?: {
      receivedAmount: number
      appliedToMonthAmount: number
      creditedAmount: number
      creditAppliedAmount: number
      refundedAmount?: number
      creditBalanceAfter: number
    }
    period?: {
      receivedAmount: number
      appliedToMonthAmount: number
      creditedAmount: number
      creditAppliedAmount: number
      refundedAmount?: number
    }
    receivedAmount: number
    appliedToMonthAmount: number
    creditedAmount: number
    creditAppliedAmount: number
    refundedAmount?: number
    creditBalanceAfter: number
  }
  period?: { month: number; year: number }
  student?: { fullName: string; studentId?: string | null }
  group?: { name: string; subject?: string | null }
}

export default function ReceiptVerifyPage() {
  const params = useParams()
  const receiptNumber = String(params.receiptNumber || '')
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const verifyUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://orbitech.uz/verify/${receiptNumber}`

  useEffect(() => {
    if (!receiptNumber) return
    setLoading(true)
    paymentsApi.verifyReceipt(receiptNumber)
      .then((res) => setResult(res.data))
      .catch(() => setResult({ valid: false, receiptNumber }))
      .finally(() => setLoading(false))
  }, [receiptNumber])

  const periodLabel = useMemo(() => {
    if (!result?.period) return null
    const { month, year } = result.period
    const name = new Intl.DateTimeFormat('uz-UZ', { month: 'long' }).format(new Date(year, month - 1, 1))
    return `${name} ${year}`
  }, [result?.period])

  const paidAtLabel = useMemo(() => {
    if (!result?.paidAt) return null
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(result.paidAt))
  }, [result?.paidAt])

  const txn = result?.allocation?.transaction ?? result?.allocation
  const mainAmount = txn?.receivedAmount ?? result?.amount ?? 0
  const overpaidAmount = txn?.creditedAmount ?? 0
  const creditApplied = txn?.creditAppliedAmount ?? 0
  const refundedAmount = txn?.refundedAmount ?? 0
  const creditBalance = txn?.creditBalanceAfter ?? 0
  const appliedToMonth = txn?.appliedToMonthAmount ?? mainAmount

  const copyUrl = () => {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 px-4 py-10 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Brand header */}
      <div className="mx-auto mb-8 flex max-w-md items-center justify-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#468432] shadow-sm">
          <span className="text-sm font-black text-white">O</span>
        </div>
        <span className="text-base font-bold text-gray-700 dark:text-gray-300">Orbitech CRM</span>
      </div>

      <div className="mx-auto max-w-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-200 bg-white p-20 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#468432] border-t-transparent" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Tekshirilmoqda…</p>
          </div>

        ) : result?.valid ? (
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">

            {/* Green gradient header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-700 px-6 pb-8 pt-7">
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10" />

              <div className="relative flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                      Tasdiqlandi
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-black text-white tracking-tight">
                    {formatCurrency(mainAmount)}
                  </p>
                  {periodLabel && (
                    <p className="mt-1 text-sm font-medium text-emerald-100">
                      {periodLabel} davri uchun
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Main info rows */}
            <div className="divide-y divide-gray-100 px-6 dark:divide-gray-800">
              {result.student?.fullName && (
                <InfoRow label="O'quvchi" value={result.student.fullName} />
              )}
              {result.student?.studentId && (
                <InfoRow label="O'quvchi ID" value={result.student.studentId} mono />
              )}
              {result.group?.name && (
                <InfoRow label="Guruh" value={result.group.name} />
              )}
              {result.group?.subject && (
                <InfoRow label="Fan" value={result.group.subject} />
              )}
              {paidAtLabel && (
                <InfoRow label="To'lov sanasi" value={paidAtLabel} />
              )}
              {result.paymentMethod && (
                <InfoRow label="To'lov usuli" value={result.paymentMethod} />
              )}

              {/* Overpayment banner */}
              {overpaidAmount > 0 && (
                <div className="py-4">
                  <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Balans: +{formatCurrency(overpaidAmount)}
                      </p>
                      <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                        Qo&apos;shimcha to&apos;lov keyingi oyga balans sifatida o&apos;tkazildi
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* QR + Receipt number */}
            <div className="mx-6 my-4 flex items-start gap-5 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
              <div className="shrink-0 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <QRCode
                  value={verifyUrl}
                  size={76}
                  level="M"
                  style={{ display: 'block' }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Kvitansiya raqami
                </p>
                <p className="mt-1 break-all font-mono text-[13px] font-bold text-gray-800 dark:text-gray-100">
                  {receiptNumber}
                </p>
                <button
                  onClick={copyUrl}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {copied
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Nusxalandi' : 'Havolani nusxalash'}
                </button>
              </div>
            </div>

            {/* PDF button */}
            {result.receiptUrl && (
              <div className="px-6 pb-2">
                <a
                  href={result.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#468432] text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3b722a]"
                >
                  <FileText className="h-4 w-4" />
                  PDF kvitansiyani ochish
                </a>
              </div>
            )}

            {/* Financial details toggle */}
            {txn && (
              <div className="mt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex w-full items-center justify-between px-6 py-3.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
                >
                  <span className="font-medium">Moliyaviy tafsilotlar</span>
                  {showDetails
                    ? <ChevronUp className="h-4 w-4" />
                    : <ChevronDown className="h-4 w-4" />}
                </button>

                {showDetails && (
                  <div className="space-y-2.5 px-6 pb-5">
                    <DetailRow label="Qabul qilingan summa" value={formatCurrency(txn.receivedAmount)} />
                    <DetailRow label="Shu oyga hisoblandi" value={formatCurrency(appliedToMonth)} />
                    {overpaidAmount > 0 && (
                      <DetailRow
                        label="Balansga o'tkazildi"
                        value={`+${formatCurrency(overpaidAmount)}`}
                        accent="blue"
                      />
                    )}
                    {creditApplied > 0 && (
                      <DetailRow label="Balansdan ishlatildi" value={formatCurrency(creditApplied)} accent="green" />
                    )}
                    {refundedAmount > 0 && (
                      <DetailRow label="Balansdan qaytarildi" value={formatCurrency(refundedAmount)} accent="blue" />
                    )}
                    <DetailRow label="Balans qoldig'i" value={formatCurrency(creditBalance)} />
                  </div>
                )}
              </div>
            )}

            <div className="pb-6" />
          </div>

        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-700 px-6 pb-8 pt-7 text-center">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Kvitansiya topilmadi</h1>
                <p className="mt-1 text-sm text-red-100">
                  Bu kvitansiya haqiqiy emas yoki mavjud emas
                </p>
              </div>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="break-all font-mono text-sm text-gray-400 dark:text-gray-500">
                {receiptNumber}
              </p>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
          Orbitech CRM — To&apos;lov tekshiruv tizimi
        </p>
      </div>
    </main>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-right text-sm font-semibold text-gray-800 dark:text-gray-100 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: 'blue' | 'green' }) {
  const color = accent === 'blue'
    ? 'text-blue-600 dark:text-blue-400'
    : accent === 'green'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-gray-700 dark:text-gray-200'
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  )
}
