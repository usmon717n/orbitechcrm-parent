'use client'
import { useEffect, useState, useCallback } from 'react'
import { notificationsApi } from '@/lib/api'
import { MessageSquareText, Send, RotateCcw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type SurveyType = 'CHOICE' | 'TEXT'

type MySurvey = {
  id: string
  question: string
  type: SurveyType
  isMandatory?: boolean
  createdAt: string
  options: Array<{ id: string; text: string; order: number }>
  myResponse: any | null
}

export default function SurveyGuard({ role }: { role: string }) {
  const [mandatorySurvey, setMandatorySurvey] = useState<MySurvey | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [textAnswer, setTextAnswer] = useState<string>('')

  const checkSurveys = useCallback(async () => {
    // Adminlar so'rovnomaga javob bermaydi
    if (role === 'ADMIN') return

    try {
      const res = await notificationsApi.getMySurveys()
      const surveys = Array.isArray(res.data?.items) ? res.data.items : []
      
      const pending = surveys.find((s: MySurvey) => s.isMandatory && !s.myResponse)

      if (pending) {
        setMandatorySurvey({
          ...pending,
          question: pending.question.replace(/^\[M\]\s*/, ''),
        })
      } else {
        setMandatorySurvey(null)
      }
    } catch {
      // Xatolik bo'lsa bloklamaymiz, lekin log qilsa bo'ladi
    }
  }, [role])

  useEffect(() => {
    checkSurveys()
  }, [checkSurveys])

  const handleSubmit = async () => {
    if (!mandatorySurvey) return

    if (mandatorySurvey.type === 'CHOICE' && !selectedOption) {
      return toast.error('Variantlardan birini tanlang')
    }
    if (mandatorySurvey.type === 'TEXT' && !textAnswer.trim()) {
      return toast.error('Javobingizni yozing')
    }

    setSubmitting(true)
    try {
      await notificationsApi.respondSurvey(mandatorySurvey.id, {
        optionId: mandatorySurvey.type === 'CHOICE' ? selectedOption : undefined,
        answerText: mandatorySurvey.type === 'TEXT' ? textAnswer.trim() : undefined,
      })
      toast.success("Javobingiz qabul qilindi. Rahmat!")
      setMandatorySurvey(null)
      setSelectedOption('')
      setTextAnswer('')
    } catch {
      toast.error("Xatolik yuz berdi. Qaytadan urinib ko'ring")
    } finally {
      setSubmitting(false)
    }
  }

  if (!mandatorySurvey) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-300">
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl dark:bg-gray-900">
          {/* Header */}
          <div className="bg-[var(--accent-gradient)] p-6 text-[var(--accent-foreground)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Iltimos, so'rovnomani bajaring</h2>
                <p className="mt-0.5 text-xs text-white/80">Bu so'rovnoma majburiy hisoblanadi</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Savol:</span>
              </div>
              <p className="text-lg font-semibold leading-relaxed text-gray-800 dark:text-gray-100">
                {mandatorySurvey.question}
              </p>
            </div>

            {mandatorySurvey.type === 'CHOICE' ? (
              <div className="space-y-2.5">
                {mandatorySurvey.options.map((opt) => {
                  const active = selectedOption === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOption(opt.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                        active
                          ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                          : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        active ? 'border-[var(--accent)]' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {active && <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />}
                      </div>
                      <span className="text-sm font-bold md:text-base">{opt.text}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <textarea
                className="input min-h-[140px] w-full resize-none rounded-2xl p-4 text-base"
                placeholder="Javobingizni shu yerga yozing..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
              />
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] text-base font-bold text-[var(--accent-foreground)] shadow-[0_18px_42px_var(--accent-glow)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-[0_18px_42px_var(--accent-glow-strong)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <RotateCcw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Yuborish va davom etish
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
              So'rovnoma yakunlangach barcha funksiyalar ochiladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
