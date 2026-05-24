'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore, readAuthFromStorage } from '@/store/auth.store'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Heart, Bell, CreditCard, TrendingUp } from 'lucide-react'
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
      if (user.role !== 'PARENT') { toast.error("Bu panel faqat ota-onalar uchun"); return }
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
    <div className="min-h-[100dvh] bg-orange-50 dark:bg-slate-950 lg:h-[100dvh] lg:overflow-hidden lg:p-5">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1480px] overflow-hidden lg:h-full lg:min-h-0 lg:rounded-[30px] lg:shadow-2xl">

        {/* LEFT — Parent Hero (warm & family) */}
        <section className="relative hidden w-[52%] lg:flex flex-col justify-between overflow-hidden p-10 text-white" style={{ background: 'linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)' }}>
          <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-orange-500/25 blur-[130px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-10 h-[400px] w-[400px] rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

          {/* Decoration */}
          <div className="absolute top-24 right-20 text-4xl opacity-15">👨‍👩‍👧</div>
          <div className="absolute bottom-44 right-14 text-3xl opacity-15">❤️</div>

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex flex-col gap-[2px]">
              <div className="flex gap-[2px]"><div className="h-3 w-3 rounded-[3px] bg-orange-400" /><div className="h-3 w-3 rounded-[3px] bg-white/20" /></div>
              <div className="flex gap-[2px]"><div className="h-3 w-3 rounded-[3px] bg-white/20" /><div className="h-3 w-3 rounded-[3px] bg-orange-400" /></div>
            </div>
            <span className="font-brand text-xl tracking-tight">Orbitech <span className="text-white/50 font-medium">Ota-ona</span></span>
          </div>

          {/* Hero */}
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-400/20 border border-orange-400/30 text-orange-200 text-xs font-semibold mb-6 tracking-widest uppercase">
              <Heart className="w-3.5 h-3.5" /> Ota-ona kabineti
            </div>
            <h1 className="text-[44px] xl:text-[56px] font-extrabold leading-[1.05] tracking-tight mb-6">
              Farzandingiz <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-200">rivojini</span><br />
              kuzating
            </h1>
            <p className="text-white/60 text-base leading-relaxed mb-10">
              Davomat, to'lovlar va natijalarni real vaqtda kuzating. Farzandingiz bilan doim aloqada bo'ling.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: TrendingUp, title: 'Natijalar', desc: "Dars natijalari va baholar" },
                { icon: Bell, title: 'Xabarnomalar', desc: "Muhim yangiliklar va eslatmalar" },
                { icon: CreditCard, title: "To'lovlar", desc: "To'lov holati va tarixi" },
                { icon: Heart, title: 'Davomat', desc: 'Kelgan va kelmagan kunlar' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/6 p-4 hover:bg-white/10 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-orange-400/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-orange-300" />
                  </div>
                  <p className="text-sm font-semibold text-white/90">{title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-white/30 font-medium">
            <span>© {new Date().getFullYear()} Orbitech CRM</span>
            <span>Parent Panel v2.0</span>
          </div>
        </section>

        {/* RIGHT — Form */}
        <section className="flex flex-1 items-center justify-center bg-white dark:bg-slate-900 px-6 py-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center lg:items-start">
              <div className="mb-4 w-[68px] h-[68px] rounded-[18px] overflow-hidden shadow-[0_12px_28px_rgba(249,115,22,0.3)] ring-4 ring-orange-50 dark:ring-orange-900/30">
                <Image src="/logo/image.png" alt="logo" width={68} height={68} className="object-cover w-full h-full" priority />
              </div>
              <h1 className="font-brand text-2xl"><span className="text-orange-600">Orbitech</span> <span className="text-slate-900 dark:text-white">Ota-ona</span></h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ota-ona kabinetiga kirish</p>
            </div>

            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-7">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Tizimga kirish</h2>
              {tenantSlug && <p className="text-xs text-orange-500 font-semibold mb-4 uppercase tracking-widest">{tenantSlug}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email yoki telefon</label>
                  <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all placeholder:text-slate-400"
                    type="text" placeholder="parent@example.com" value={identifier} autoFocus autoComplete="username"
                    onChange={(e) => setIdentifier(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Parol</label>
                  <div className="relative">
                    <input className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all placeholder:text-slate-400"
                      type={showPwd ? 'text' : 'password'} placeholder="Parolingizni kiriting" value={password} autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-[0_4px_14px_rgba(249,115,22,0.4)] disabled:opacity-60 mt-2">
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Kirilmoqda...</span> : 'Kirish'}
                </button>
              </form>
              <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl text-xs text-slate-500 dark:text-slate-400">
                Hisobingizni yaratish uchun markaz adminstratsorasiga murojaat qiling.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
