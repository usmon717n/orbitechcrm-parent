'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore, readAuthFromStorage } from '@/store/auth.store'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Cog, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const STUDENT_ID_REGEX = /^(ID\d{5}|ST\d{2}[A-Z2-9]{6})$/i

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
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

  // URL dan tenant slug o'qiladi: /auth/login?tenant=najot-talim
  const tenantSlug = searchParams.get('tenant') ?? undefined
  const isSwitchMode = searchParams.get('switch') === '1'

  const isStudentId = STUDENT_ID_REGEX.test(identifier.trim())

  useEffect(() => {
    const { user, isAuthenticated } = readAuthFromStorage()
    const canSwitchFromActiveSession = isSwitchMode && user?.role === 'SUPERADMIN'
    if (isAuthenticated && user && !canSwitchFromActiveSession) {
      const path =
        user.role === 'SUPERADMIN' ? '/superadmin' :
        user.role === 'ADMIN' ? '/admin' :
        user.role === 'TEACHER' ? '/teacher' : '/student'
      router.replace(path)
    } else {
      setReady(true)
    }
  }, [isSwitchMode, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !password.trim()) { toast.error(t('login.fillAllFields')); return }

    // Student ID bilan kirish tenant slug talab qiladi
    if (isStudentId && !tenantSlug) {
      toast.error("O'quvchilar markaz havolasi orqali kirishlari kerak")
      return
    }

    setLoading(true)
    try {
      const res = await authApi.login(identifier.trim(), password.trim(), tenantSlug)
      const { access_token, refresh_token, user, tenant } = res.data
      setAuth(user, access_token, refresh_token, tenant ?? undefined)
      const path =
        user.role === 'SUPERADMIN' ? '/superadmin' :
        user.role === 'ADMIN' ? '/admin' :
        user.role === 'TEACHER' ? '/teacher' : '/student'
      toast.success(`${t('login.welcome')}, ${user.firstName}!`)
      router.replace(path)
    } catch (err: any) {
      const msg = err.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || t('login.invalidCredentials')))
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#f2f4f7] dark:bg-gray-950 lg:h-[100dvh] lg:overflow-hidden lg:p-5">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1480px] overflow-hidden lg:h-full lg:min-h-0 lg:rounded-[30px] lg:border lg:border-gray-200/80 dark:lg:border-gray-800/80 lg:shadow-[0_26px_72px_rgba(15,23,42,0.14)]">
        <section className="relative hidden w-[52%] lg:flex lg:min-h-0 lg:overflow-hidden flex-col justify-start gap-6 overflow-hidden bg-slate-950 p-8 xl:p-10 text-white">
          {/* Abstract background elements */}
          <div className="absolute -top-[30%] -right-[10%] h-[600px] w-[600px] rounded-full bg-orange-600/20 blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
          <div className="absolute top-[40%] left-[20%] h-[300px] w-[300px] rounded-full bg-purple-500/15 blur-[100px] pointer-events-none" />

          {/* Logo / Brand header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex flex-col gap-[2px]">
              <div className="flex items-center gap-[2px]">
                <div className="h-3 w-3 rounded-[3px] bg-orange-500 shadow-sm shadow-orange-500/50" />
                <div className="h-3 w-3 rounded-[3px] bg-white/20" />
              </div>
              <div className="flex items-center gap-[2px]">
                <div className="h-3 w-3 rounded-[3px] bg-white/20" />
                <div className="h-3 w-3 rounded-[3px] bg-orange-500 shadow-sm shadow-orange-500/50" />
              </div>
            </div>
            <span className="font-brand text-xl tracking-tight text-white">
              Orbitech <span className="font-medium text-white/70">CRM</span>
            </span>
          </div>

          {/* Center content */}
          <div className="relative z-10 mx-auto max-w-xl pb-2 lg:pb-0">
            <h1 className="mb-4 text-[42px] font-extrabold leading-[1.06] tracking-tight xl:text-[54px] 2xl:text-[64px] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/70">
              {t('loginHero.titleLine1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 drop-shadow-sm">
                {t('loginHero.titleLine2')}
              </span>
            </h1>
            
            {/* Feature cards */}
            <div className="mt-10 grid grid-cols-2 gap-3 xl:mt-12 xl:gap-4">
              <div className="group flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-4 xl:p-5 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10 hover:border-white/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base xl:text-lg text-white mb-1">{t('loginHero.feature1Title')}</h3>
                  <p className="text-xs xl:text-sm text-white/50 leading-relaxed font-medium">
                    {t('loginHero.feature1Desc')}
                  </p>
                </div>
              </div>

              <div className="group flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-4 xl:p-5 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-white/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Cog className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base xl:text-lg text-white mb-1">{t('loginHero.feature2Title')}</h3>
                  <p className="text-xs xl:text-sm text-white/50 leading-relaxed font-medium">
                    {t('loginHero.feature2Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer content */}
          <div className="relative z-10 mt-auto flex items-end justify-between gap-4 text-xs xl:text-sm font-medium text-white/40">
            <div className="space-y-2">
              <span className="block">© {new Date().getFullYear()} Orbitech CRM</span>
            </div>
            <div className="hidden xl:flex items-center gap-4 pb-1">
              <span>{t('loginHero.version')} 2.0</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{t('loginHero.rights')}</span>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center bg-[#f8f9fb] dark:bg-gray-950 px-5 py-8 sm:px-8 lg:min-h-0 lg:overflow-hidden lg:px-10 lg:py-7 xl:px-12 xl:py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-4 inline-flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-[20px] shadow-[0_12px_24px_rgba(249,122,61,0.28)]">
                <Image
                  src="/logo/image.png"
                  alt="Orbitech CRM icon"
                  width={74}
                  height={74}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="font-brand text-2xl">
                <span className="text-orange-500">Orbitech</span>{' '}
                <span className="text-gray-900 dark:text-white">CRM</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t('login.subtitle')}</p>
            </div>

            <div className="card bg-white/92 dark:bg-gray-900/88 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800 shadow-[0_20px_44px_rgba(15,23,42,0.08)]">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">{t('login.title')}</h2>
              {tenantSlug && (
                <p className="text-sm text-orange-500 font-medium mb-5">
                  {tenantSlug}
                </p>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">{t('login.identifier')}</label>
                  <input
                    className="input"
                    type="text"
                    placeholder={t('login.identifierPlaceholder')}
                    value={identifier}
                    autoComplete="username"
                    autoFocus
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">{t('login.password')}</label>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showPwd ? 'text' : 'password'}
                      placeholder={t('login.passwordPlaceholder')}
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('login.loading')}
                    </span>
                  ) : t('login.submit')}
                </button>
              </form>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-500 dark:text-gray-400">
                {t('login.forgot')}
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>
  )
}
