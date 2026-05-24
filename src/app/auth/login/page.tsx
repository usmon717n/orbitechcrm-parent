'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore, readAuthFromStorage } from '@/store/auth.store'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Heart, Bell, CreditCard, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-orange-950"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [ready, setReady] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useI18n()
  const tenantSlug = searchParams.get('tenant') ?? undefined

  useEffect(() => {
    const { user, isAuthenticated } = readAuthFromStorage()
    if (isAuthenticated && user && user.role === 'PARENT') router.replace('/parent')
    else setReady(true)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !password.trim()) { toast.error(t('login.fillAllFields')); return }
    setLoading(true)
    try {
      const res = await authApi.login(identifier.trim(), password.trim(), tenantSlug)
      const { access_token, refresh_token, user, tenant } = res.data
      if (user.role !== 'PARENT') { toast.error("Bu panel faqat ota-onalar uchun"); setLoading(false); return }
      setAuth(user, access_token, refresh_token, tenant ?? undefined)
      toast.success(`Xush kelibsiz, ${user.firstName}!`)
      router.replace('/parent')
    } catch (err: any) {
      const msg = err.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || t('login.invalidCredentials')))
    } finally { setLoading(false) }
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-orange-950"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-[100dvh] bg-slate-100 dark:bg-slate-950 lg:h-[100dvh] lg:overflow-hidden lg:p-4 xl:p-6">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1440px] overflow-hidden lg:h-full lg:min-h-0 lg:rounded-[28px] lg:shadow-[0_32px_80px_rgba(0,0,0,0.35)]">

        {/* ── LEFT ─────────────────────────────────────── */}
        <section className="relative hidden w-[55%] lg:flex flex-col overflow-hidden select-none"
          style={{ background: 'linear-gradient(145deg,#1c0a00 0%,#431407 40%,#7c2d12 70%,#2c0f00 100%)' }}>

          {/* Background layers */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.055]"
              style={{ backgroundImage: 'radial-gradient(#fed7aa 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
            {/* Glow blobs */}
            <div className="absolute top-[-15%] right-[-5%] w-[560px] h-[560px] rounded-full opacity-28"
              style={{ background: 'radial-gradient(circle,#f97316,transparent 65%)' }} />
            <div className="absolute bottom-[-20%] left-[-8%] w-[480px] h-[480px] rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle,#f59e0b,transparent 65%)' }} />
            <div className="absolute top-[45%] left-[30%] w-[280px] h-[280px] rounded-full opacity-13"
              style={{ background: 'radial-gradient(circle,#fb923c,transparent 65%)' }} />
          </div>

          <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-auto">
              <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-lg shadow-orange-500/20">
                <Image src="/logo/image.png" alt="logo" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              <span className="font-brand text-lg text-white tracking-tight">Orbitech <span className="text-orange-400">Ota-ona</span></span>
            </div>

            {/* Hero content */}
            <div className="mt-16 mb-10">
              {/* Stats */}
              <div className="flex gap-3 mb-10 flex-wrap">
                {[
                  { icon: TrendingUp, val: '96%', label: "Davomat", color: '#fb923c' },
                  { icon: Heart, val: '4.9★', label: "Natijalar", color: '#fbbf24' },
                  { icon: Bell, val: '3', label: "Yangiliklar", color: '#f97316' },
                  { icon: CreditCard, val: "To'liq", label: "To'lov holati", color: '#fdba74' },
                ].map(({ icon: Icon, val, label, color }) => (
                  <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: color + '22' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white leading-none">{val}</p>
                      <p className="text-[10px] text-white/40 mt-0.5 leading-none">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h1 className="text-[40px] xl:text-[52px] font-black leading-[1.04] tracking-tight text-white mb-5">
                Farzandingiz<br />
                <span style={{ background: 'linear-gradient(90deg,#fb923c,#fbbf24,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  rivojini
                </span> real vaqtda<br />
                kuzating
              </h1>
              <p className="text-white/50 text-base leading-relaxed mb-10 max-w-md">
                Davomat, to'lovlar, baholar va xabarnomalarni — barchasini bitta qulay paneldan nazorat qiling.
              </p>

              <div className="space-y-3">
                {[
                  "Farzandingiz davomati va baholarini ko'rish",
                  "To'lov holati va tarixi",
                  "Muhim xabarnomalar va eslatmalar",
                ].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="text-sm text-white/55">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white/25 font-medium mt-auto">
              <span>© {new Date().getFullYear()} Orbitech CRM</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />Tizim ishlayapti
              </span>
            </div>
          </div>
        </section>

        {/* ── RIGHT ────────────────────────────────────── */}
        <section className="flex flex-1 items-center justify-center bg-white dark:bg-[#1a0a00] px-6 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-[400px]">
            {/* Mobile brand */}
            <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
              <div className="w-8 h-8 rounded-xl overflow-hidden">
                <Image src="/logo/image.png" alt="logo" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <span className="font-brand text-lg text-slate-900 dark:text-white">Orbitech <span className="text-orange-600">Ota-ona</span></span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Kirish</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ota-ona kabinetiga xush kelibsiz</p>
              {tenantSlug && <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold">{tenantSlug}</div>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Email yoki telefon</label>
                <input
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm outline-none transition-all focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  type="text" placeholder="parent@example.com"
                  value={identifier} autoFocus autoComplete="username"
                  onChange={e => setIdentifier(e.target.value)} />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-2">Parol</label>
                <div className="relative">
                  <input
                    className="w-full h-11 px-4 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm outline-none transition-all focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                    value={password} autoComplete="current-password"
                    onChange={e => setPassword(e.target.value)} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: loading ? '#ea580c' : 'linear-gradient(135deg,#ea580c,#f97316)', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Kirilmoqda...</>
                  : <>Kirish <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <p className="mt-6 text-[12px] text-slate-400 dark:text-slate-600 text-center leading-relaxed">
              Hisob yaratish uchun markaz administratoriga murojaat qiling.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
