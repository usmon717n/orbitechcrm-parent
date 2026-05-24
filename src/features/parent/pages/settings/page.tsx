'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { settingsApi, studentsApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useI18n } from '@/lib/i18n'
import toast from 'react-hot-toast'
import { Lock, Phone, User, Send, Copy, RefreshCw, CheckCircle } from 'lucide-react'
import DarkModeToggle from '@/components/DarkModeToggle'
import MobileLogout from '@/components/MobileLogout'
import { MIN_PASSWORD_LENGTH } from '@/lib/password'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

function PwdInput({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-4 pr-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-[var(--accent)]/60 focus:ring-4 focus:ring-[var(--accent)]/10 outline-none transition-all text-sm font-semibold text-gray-800 dark:text-gray-100 placeholder:text-gray-400 placeholder:font-normal"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

export default function ParentSettingsPage() {
  const { t } = useI18n()
  const user = useAuthStore(s => s.user)
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [tgToken, setTgToken] = useState<string | null>(null)
  const [tgLoading, setTgLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGetToken = async () => {
    setTgLoading(true)
    try {
      const res = await studentsApi.getTelegramToken()
      setTgToken(res.data.token)
    } catch {
      toast.error(t('parent.errorOccurred'))
    } finally {
      setTgLoading(false)
    }
  }

  const copyToken = () => {
    if (!tgToken) return
    navigator.clipboard.writeText(`/start ${tgToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwd.current.trim()) return toast.error(t('parent.enterCurrentPwd'))
    if (pwd.next !== pwd.confirm) return toast.error(t('settings.passwordMismatch'))
    if (pwd.next.length < MIN_PASSWORD_LENGTH) return toast.error(t('settings.passwordMin'))
    setSaving(true)
    try {
      await settingsApi.changePassword({ currentPassword: pwd.current, newPassword: pwd.next })
      toast.success(t('settings.passwordUpdated'))
      setPwd({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('settings.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="PARENT" title={t('nav.settings')}>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-sm mx-auto space-y-4 pb-10">

        <DarkModeToggle />

        {/* Account card */}
        <motion.div variants={fadeUp}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
                <User className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-black text-gray-900 dark:text-white">{t('parent.account')}</p>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              <div className="flex items-center gap-3 px-5 py-4">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('parent.name')}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-4">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('parent.loginPhone')}</p>
                  <p className="text-sm font-mono font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Password change */}
        <motion.div variants={fadeUp}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
                <Lock className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-black text-gray-900 dark:text-white">{t('settings.changePassword')}</p>
            </div>

            <form onSubmit={handlePasswordChange} className="p-5 space-y-3">
              <PwdInput
                label={t('settings.currentPassword')}
                value={pwd.current}
                onChange={v => setPwd(p => ({ ...p, current: v }))}
                placeholder={t('settings.currentPasswordPlaceholder')}
              />
              <PwdInput
                label={t('settings.newPassword')}
                value={pwd.next}
                onChange={v => setPwd(p => ({ ...p, next: v }))}
                placeholder={t('settings.minPasswordPlaceholder')}
              />
              <PwdInput
                label={t('settings.confirmPassword')}
                value={pwd.confirm}
                onChange={v => setPwd(p => ({ ...p, confirm: v }))}
                placeholder={t('settings.confirmPasswordPlaceholder')}
              />

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}
                >
                  {saving ? t('settings.saving') : t('settings.savePassword')}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Telegram ulash */}
        <motion.div variants={fadeUp}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent)' }}>
                <Send className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-black text-gray-900 dark:text-white">{t('parent.telegramNotif')}</p>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('parent.telegramDesc')}
              </p>

              {!tgToken ? (
                <button
                  onClick={handleGetToken}
                  disabled={tgLoading}
                  className="w-full h-12 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}
                >
                  {tgLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('parent.getCode')}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t('parent.step1')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {t('parent.step2Open')}: <b>@{process.env.NEXT_PUBLIC_BOT_USERNAME || 'ERP_notify_bot'}</b>
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t('parent.step2Send')}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono font-bold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600">
                        /start {tgToken}
                      </code>
                      <button
                        onClick={copyToken}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
                        style={{ background: 'var(--accent)' }}
                      >
                        {copied ? <CheckCircle className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleGetToken}
                    className="w-full h-10 rounded-2xl font-bold text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t('parent.newCode')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <MobileLogout />
        </motion.div>

      </motion.div>
    </DashboardLayout>
  )
}
