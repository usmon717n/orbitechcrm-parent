import axios, { AxiosError, AxiosProgressEvent } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Dedicated client for refresh calls — bypasses main interceptors entirely
const refreshClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

const AUTH_STORAGE_KEY = 'auth-storage'
const AUTH_STORAGE_MODE_KEY = 'auth-storage-mode'
const TOKEN_REFRESH_BUFFER_MS = 30_000

type StoredAuthState = {
  token?: string | null
  refreshToken?: string | null
  user?: {
    role?: string
    tenantId?: string | null
  } | null
  tenant?: {
    id?: string | null
  } | null
}

function getStoredAuthState(): StoredAuthState | null {
  if (typeof window === 'undefined') return null
  try {
    const useSessionAuth = sessionStorage.getItem(AUTH_STORAGE_MODE_KEY) === 'session'
    const raw = useSessionAuth
      ? sessionStorage.getItem(AUTH_STORAGE_KEY)
      : localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.state ?? null
  } catch {
    return null
  }
}

function getToken(): string | null {
  return getStoredAuthState()?.token ?? null
}

function getRefreshToken(): string | null {
  return getStoredAuthState()?.refreshToken ?? null
}

function getTenantId(): string | null {
  const state = getStoredAuthState()
  if (!state) return null

  const tenantIdFromTenant = state.tenant?.id ?? null
  const tenantIdFromUser = state.user?.tenantId ?? null

  // Xavfsizroq ustuvorlik: user.tenantId mavjud bo'lsa, aynan shuni ishlatamiz.
  return tenantIdFromUser || tenantIdFromTenant || null
}

function getUserRole(): string | null {
  return getStoredAuthState()?.user?.role ?? null
}

function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = JSON.parse(atob(padded))
    const exp = Number(decoded?.exp)
    if (!Number.isFinite(exp) || exp <= 0) return null
    return exp * 1000
  } catch {
    return null
  }
}

function shouldPreflightRefresh(token: string): boolean {
  const expiryMs = decodeJwtExpiryMs(token)
  if (!expiryMs) return false
  return expiryMs <= Date.now() + TOKEN_REFRESH_BUFFER_MS
}

function handleUnauthorizedState() {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem(AUTH_STORAGE_MODE_KEY) === 'session') {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
  window.dispatchEvent(new CustomEvent('auth:unauthorized'))
}

// ─── Unified refresh state ───────────────────────────────────────────────────
// Single source of truth shared by BOTH the request preflight and the 401
// response handler. This eliminates the race condition where two independent
// refresh flows could fire simultaneously.

let activeRefreshPromise: Promise<string | null> | null = null

type QueueEntry = {
  resolve: (value: any) => void
  reject: (reason?: any) => void
  request: any
}
let pendingQueue: QueueEntry[] = []

async function performRefresh(): Promise<string | null> {
  // If a refresh is already in flight, join it — never start a second one
  if (activeRefreshPromise) return activeRefreshPromise

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    handleUnauthorizedState()
    return null
  }

  activeRefreshPromise = (async () => {
    try {
      const res = await refreshClient.post('/auth/refresh', { refreshToken })
      const { access_token, refresh_token, user, tenant } = res.data as {
        access_token?: string
        refresh_token?: string
        user?: any
        tenant?: any
      }

      if (!access_token || !refresh_token) {
        handleUnauthorizedState()
        return null
      }

      const { useAuthStore } = await import('@/store/auth.store')
      const currentUser = useAuthStore.getState().user
      const nextUser = user ?? currentUser
      if (!nextUser) {
        handleUnauthorizedState()
        return null
      }

      useAuthStore.getState().setAuth(nextUser, access_token, refresh_token, tenant ?? undefined)

      // Retry all requests that were queued while refresh was in flight
      pendingQueue.forEach(({ resolve, reject, request }) => {
        if (!request) { reject(new Error('Missing request config')); return }
        if (request.headers) request.headers.Authorization = `Bearer ${access_token}`
        api(request).then(resolve).catch(reject)
      })
      pendingQueue = []

      return access_token
    } catch {
      pendingQueue.forEach(({ reject }) => reject(new Error('Token refresh failed')))
      pendingQueue = []
      handleUnauthorizedState()
      return null
    } finally {
      activeRefreshPromise = null
    }
  })()

  return activeRefreshPromise
}

// ─── Request interceptor ─────────────────────────────────────────────────────
// Proactively refreshes the token before it expires (30s buffer).
api.interceptors.request.use(async (config) => {
  const isAuthEndpoint = config.url?.includes('/auth/') ?? false
  let token = getToken()

  if (token && !isAuthEndpoint && shouldPreflightRefresh(token)) {
    token = await performRefresh()
    if (!token) {
      return Promise.reject(new AxiosError('Authentication expired', 'ERR_CANCELED', config))
    }
  }

  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const role = getUserRole()
  const tenantId = getTenantId()

  // Superadmin uchun global endpointlarga tenant headerni avtomatik tiqmaymiz.
  if (tenantId && role !== 'SUPERADMIN' && !isAuthEndpoint) {
    config.headers['X-Tenant-ID'] = tenantId
  }

  return config
})

// ─── Response interceptor ────────────────────────────────────────────────────
// Handles unexpected 401s (e.g. token revoked server-side).
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    // Auth endpoint errors are returned as-is (wrong password, etc.)
    if (error.config?.url?.includes('/auth/')) {
      return Promise.reject(error)
    }

    if (status === 401 && !originalRequest?._retry && typeof window !== 'undefined') {
      originalRequest!._retry = true

      // If a refresh is already running, queue this request behind it
      if (activeRefreshPromise) {
        return new Promise((resolve, reject) => {
          if (!originalRequest) { reject(error); return }
          pendingQueue.push({
            resolve,
            reject,
            // Mark retry so re-queued requests don't loop on another 401
            request: { ...originalRequest, _retry: true },
          })
        })
      }

      const token = await performRefresh()
      if (!token) return Promise.reject(error)

      if (originalRequest?.headers) originalRequest.headers.Authorization = `Bearer ${token}`
      return api(originalRequest!)
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  login: (identifier: string, password: string, tenantSlug?: string) =>
    api.post('/auth/login', { identifier, password, ...(tenantSlug ? { tenantSlug } : {}) }),
  logout: (refreshToken: string) =>
    refreshClient.post('/auth/logout', { refreshToken }),
}
export const studentsApi = {
  create: (data: any) => api.post('/students', data),
  getAll: (params?: any) => api.get('/students', { params }),
  getOne: (id: string) => api.get(`/students/${id}`),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  toggleActive: (id: string) => api.patch(`/students/${id}/toggle-active`),
  bulkSetActive: (ids: string[], isActive: boolean) => api.patch('/students/bulk/status', { ids, isActive }),
  resetPassword: (id: string) => api.patch(`/students/${id}/reset-password`),
  consumePasswordTicket: (ticketId: string) => api.get(`/students/password-tickets/${ticketId}`),
  delete: (id: string) => api.delete(`/students/${id}`),
  getMe: () => api.get('/students/me'),
  getMyChildData: () => api.get('/parents/me'),
  getMyChildPsychology: () => api.get('/parents/me/psychology'),
  getMyChildAttendance: () => api.get('/parents/me/attendance'),
  getMyChildTime: () => api.get('/parents/me/time'),
  getMyChildTimeDetail: (date: string, period: string) =>
    api.get('/parents/me/time-detail', { params: { date, period } }),
  getTelegramToken: () => api.post<{ token: string }>('/parents/me/telegram-token'),
}
export const teachersApi = {
  create: (data: any) => api.post('/teachers', data),
  getAll: () => api.get('/teachers'),
  getOne: (id: string) => api.get(`/teachers/${id}`),
  update: (id: string, data: any) => api.put(`/teachers/${id}`, data),
  updatePassword: (id: string, password: string) =>
    api.patch(`/teachers/${id}/password`, { password }),
  toggleActive: (id: string) => api.patch(`/teachers/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/teachers/${id}`),
  getMe: () => api.get('/teachers/me'),
}
export const groupsApi = {
  create: (data: any) => api.post('/groups', data),
  getAll: (teacherId?: string) => api.get('/groups', { params: { teacherId } }),
  getOne: (id: string) => api.get(`/groups/${id}`),
  getStats: (id: string, params?: { period?: 'month' | 'last3' | 'overall'; month?: string }) =>
    api.get(`/groups/${id}/stats`, { params }),
  exportStats: (
    id: string,
    params?: { format?: 'excel' | 'pdf'; period?: 'month' | 'last3' | 'overall'; month?: string }
  ) =>
    api.get(`/groups/${id}/stats/export`, { params, responseType: 'blob', timeout: 30000 }),
  update: (id: string, data: any) => api.put(`/groups/${id}`, data),
  setFlexLessons: (id: string, enabled: boolean) =>
    api.patch(`/groups/${id}/flex-lessons`, { enabled }),
  updateStatus: (id: string, status: 'ACTIVE' | 'ENDED' | 'NOT_STARTED') =>
    api.patch(`/groups/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/groups/${id}`),
  addStudent: (groupId: string, studentId: string) =>
    api.post(`/groups/${groupId}/students/${studentId}`),
  removeStudent: (groupId: string, studentId: string) =>
    api.delete(`/groups/${groupId}/students/${studentId}`),
  getMy: () => api.get('/groups/my'),
  getTeacherMy: () => api.get('/groups/teacher/my'),
}
export const paymentsApi = {
  upsert: (data: any) => api.post('/payments', data),
  addTransaction: (data: any) => api.post('/payments/transactions', data),
  generateReceipt: (paymentId: string) => api.post(`/payments/${paymentId}/receipt`),
  generateTransactionReceipt: (transactionId: string) => api.post(`/payments/transactions/${transactionId}/receipt`),
  verifyReceipt: (receiptNumber: string) => api.get(`/payments/receipts/verify/${receiptNumber}`),
  getGroupPayments: (groupId: string, month: number, year: number) =>
    api.get(`/payments/group/${groupId}`, { params: { month, year } }),
  exportGroupPayments: (groupId: string, month: number, year: number) =>
    api.get(`/payments/group/${groupId}/export`, { params: { month, year }, responseType: 'blob', timeout: 30000 }),
  getMy: () => api.get('/payments/my'),
  getMyCredit: () => api.get('/payments/my-credit'),
  getDiscountCandidates: (month: number, year: number) =>
    api.get('/payments/discount-candidates', { params: { month, year } }),
  getDiscountRules: () => api.get('/payments/discount-rules'),
  createDiscountRule: (data: {
    studentId: string
    discountType: 'TARGET' | 'PERCENT' | 'AMOUNT'
    targetMonthlyAmount?: number
    discountPercent?: number
    discountAmount?: number
    startMonth: number
    startYear: number
    durationMonths?: number
    note?: string
  }) => api.post('/payments/discount-rules', data),
  deleteDiscountRule: (ruleId: string) =>
    api.delete(`/payments/discount-rules/${ruleId}`),
  refundCredit: (data: {
    studentId: string
    paymentId: string
    source?: 'BALANCE' | 'MONTH_PAYMENT'
    amount: number
    note?: string
  }) => api.post('/payments/refund', data),
  getStats: (month: number, year: number) =>
    api.get('/payments/stats', { params: { month, year } }),
  getDebts: (month: number, year: number) =>
    api.get('/payments/debts', { params: { month, year } }),
  exportDebts: (month: number, year: number, format: 'excel' | 'pdf' = 'excel') =>
    api.get('/payments/debts/export', { params: { month, year, format }, responseType: 'blob', timeout: 30000 }),
}
export const expensesApi = {
  create: (data: any) => api.post('/expenses', data),
  getAll: (params?: any) => api.get('/expenses', { params }),
  getOverview: (month?: number, year?: number) =>
    api.get('/expenses/overview', { params: month && year ? { month, year } : undefined }),
  export: (params?: any) => api.get('/expenses/export', { params, responseType: 'blob', timeout: 30000 }),
}
export const homeworkApi = {
  create: (data: any) => api.post('/homework', data),
  getMy: () => api.get('/homework/my'),
  getGroupHomeworks: (groupId: string) => api.get(`/homework/group/${groupId}`),
  getGroupHomeworksForStudent: (groupId: string) => api.get(`/homework/student/group/${groupId}`),
  submit: (homeworkId: string, data: { fileUrl?: string; fileUrls?: string[]; comment?: string; answers?: string[] }) =>
    api.post(`/homework/${homeworkId}/submit`, data),
  getSubmissions: (homeworkId: string) =>
    api.get(`/homework/${homeworkId}/submissions`),
  gradeSubmission: (submissionId: string, data: any) =>
    api.patch(`/homework/submissions/${submissionId}/grade`, data),
  requestRevision: (submissionId: string, data: { feedback: string }) =>
    api.patch(`/homework/submissions/${submissionId}/request-revision`, data),
  delete: (homeworkId: string) => api.delete(`/homework/${homeworkId}`),
}

export const filesApi = {
  upload: (formData: FormData, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      timeout: 90000,
    }),
  delete: (id: string) => api.delete(`/files/${id}`),
}
export const attendanceApi = {
  createLesson: (data: any) => api.post('/attendance/lessons', data),
  markAttendance: (lessonId: string, data: any) =>
    api.post(`/attendance/lessons/${lessonId}/mark`, data),
  unlockAttendance: (lessonId: string) =>
    api.patch(`/attendance/lessons/${lessonId}/unlock`),
  getLessonAttendance: (lessonId: string) =>
    api.get(`/attendance/lessons/${lessonId}`),
  getGroupLessons: (groupId: string) =>
    api.get(`/attendance/groups/${groupId}/lessons`),
  getMy: (params?: { groupId?: string; page?: number; limit?: number }) =>
    api.get('/attendance/my', { params }),
}
export const ratingsApi = {
  getOverall: (params?: any) => api.get('/ratings/overall', { params }),
  getGroup: (groupId: string) => api.get(`/ratings/group/${groupId}`),
  getMy: () => api.get('/ratings/my'),
}
export const lessonRatingApi = {
  rate: (data: { lessonId: string; rating: number; reason?: string }) =>
    api.post('/lesson-ratings', data),
  getMy: () => api.get('/lesson-ratings/my'),
  getTeacherStats: () => api.get('/lesson-ratings/teacher-stats'),
}
export const teacherOfMonthApi = {
  getRankings: (params?: { month?: number; year?: number }) =>
    api.get('/teacher-of-month/rankings', { params }),
  vote: (teacherId: string) =>
    api.post('/teacher-of-month/vote', { teacherId }),
  getMyVote: (params?: { month?: number; year?: number }) =>
    api.get('/teacher-of-month/my-vote', { params }),
  notifyStudents: (data: { scheduledAt: string; month: number; year: number; message?: string }) =>
    api.post('/teacher-of-month/notify', data),
}
export const notificationsApi = {
  send: (data: any) => api.post('/notifications', data),
  createSurvey: (data: any) => api.post('/notifications/surveys', data),
  getSurveys: () => api.get('/notifications/surveys'),
  getMySurveys: () => api.get('/notifications/surveys/my'),
  deactivateSurvey: (id: string) => api.patch(`/notifications/surveys/${id}/deactivate`),
  exportSurvey: (id: string) => api.get(`/notifications/surveys/${id}/export`, { responseType: 'blob', timeout: 30000 }),
  respondSurvey: (id: string, data: any) => api.post(`/notifications/surveys/${id}/responses`, data),
  getMy: (params?: any) => api.get('/notifications/my', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  getMandatoryUnread: () => api.get('/notifications/mandatory-unread'),
  getPushPublicKey: () => api.get('/notifications/push/public-key'),
  subscribePush: (data: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    api.post('/notifications/push/subscribe', data),
  unsubscribePush: (endpoint: string) =>
    api.post('/notifications/push/unsubscribe', { endpoint }),
}
export const settingsApi = {
  getProfile: () => api.get('/settings/profile'),
  getMaintenanceBanner: () => api.get('/settings/maintenance-banner'),
  updateMaintenanceBanner: (enabled: boolean) => api.patch('/settings/maintenance-banner', { enabled }),
  changePassword: (data: any) => api.patch('/settings/password', data),
  uploadAvatar: (formData: FormData) =>
    api.post('/settings/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
export const dashboardApi = {
  getStats: () => api.get('/users/dashboard-stats'),
  getMonthlyRevenue: (months = 6) => api.get('/users/monthly-revenue', { params: { months } }),
}

export const sessionsApi = {
  heartbeat: () => api.post('/sessions/heartbeat'),
  getGroupDaily: (groupId: string, date: string) =>
    api.get('/sessions/group-daily', { params: { groupId, date } }),
}

export const reminderApi = {
  getRules: () => api.get('/payment-reminders/rules'),
  createRule: (data: any) => api.post('/payment-reminders/rules', data),
  updateRule: (id: string, data: any) => api.patch(`/payment-reminders/rules/${id}`, data),
  toggleRule: (id: string) => api.patch(`/payment-reminders/rules/${id}/toggle`),
  deleteRule: (id: string) => api.delete(`/payment-reminders/rules/${id}`),
  previewRule: (id: string, month?: number, year?: number) =>
    api.get(`/payment-reminders/rules/${id}/preview`, {
      params: month && year ? { month, year } : undefined,
    }),
  previewCustom: (data: any) => api.post('/payment-reminders/preview-custom', data),
  triggerRule: (id: string, data?: { month?: number; year?: number }) =>
    api.post(`/payment-reminders/rules/${id}/trigger`, data ?? {}),
  sendCustom: (data: any) => api.post('/payment-reminders/send-custom', data),
  getStats: (month?: number, year?: number) =>
    api.get('/payment-reminders/stats', {
      params: month && year ? { month, year } : undefined,
    }),
  getLogs: (limit?: number) =>
    api.get('/payment-reminders/logs', { params: limit ? { limit } : undefined }),
}
export const quizApi = {
  // Teacher
  create: (data: any) => api.post('/quiz', data),
  getMyQuizzes: () => api.get('/quiz/teacher/my'),
  getQuizWithQuestions: (quizId: string) => api.get(`/quiz/teacher/${quizId}`),
  addQuestion: (quizId: string, data: any) => api.post(`/quiz/${quizId}/questions`, data),
  deleteQuestion: (questionId: string) => api.delete(`/quiz/questions/${questionId}`),
  deleteQuiz: (quizId: string) => api.delete(`/quiz/${quizId}`),
  // Student
  getAllQuizzes: () => api.get('/quiz/all'),
  getQuizForStudent: (quizId: string) => api.get(`/quiz/student/${quizId}`),
  submitAttempt: (quizId: string, data: any) => api.post(`/quiz/${quizId}/submit`, data),
  getMyAttempts: () => api.get('/quiz/attempts/my'),
  getAttempt: (attemptId: string) => api.get(`/quiz/attempts/${attemptId}`),
}
export const supportApi = {
  sendTicket: (data: { type: 'COMPLAINT' | 'SUGGESTION'; category?: string; message: string }) =>
    api.post('/support/tickets', data),
  getTickets: (params?: { status?: 'PENDING' | 'ACCEPTED' }) =>
    api.get('/support/tickets', { params }),
  getMyTickets: () => api.get('/support/tickets/my'),
  acceptTicket: (id: string) => api.patch(`/support/tickets/${id}/accept`),
}

export const tenantsApi = {
  // Core
  getAll: () => api.get('/tenants'),
  getOne: (id: string) => api.get(`/tenants/${id}`),
  getStats: (id: string) => api.get(`/tenants/${id}/stats`),
  create: (data: {
    name: string
    slug: string
    plan?: string
    admin?: { firstName: string; lastName: string; email: string; password: string }
    features?: Record<string, boolean>
  }) => api.post('/tenants', data),
  update: (id: string, data: { name?: string; slug?: string; plan?: string; isActive?: boolean }) => api.put(`/tenants/${id}`, data),
  remove: (id: string) => api.delete(`/tenants/${id}`),
  createAdmin: (tenantId: string, data: { firstName: string; lastName: string; email: string; password: string; features?: Record<string, boolean> }) => api.post(`/tenants/${tenantId}/admin`, data),
  listAdmins: (tenantId: string) => api.get(`/tenants/${tenantId}/admins`),
  toggleAdmin: (tenantId: string, adminId: string) => api.patch(`/tenants/${tenantId}/admins/${adminId}/toggle`),
  resetAdminPassword: (tenantId: string, adminId: string, data: { password: string }) => api.patch(`/tenants/${tenantId}/admins/${adminId}/reset-password`, data),
  updateAdminFeatures: (tenantId: string, adminId: string, data: Record<string, boolean>) => api.put(`/tenants/${tenantId}/admins/${adminId}/features`, data),

  // Feature 1: Impersonation
  impersonate: (tenantId: string) => api.post(`/tenants/${tenantId}/impersonate`),

  // Feature 2: Analytics
  getAnalytics: () => api.get('/tenants/analytics'),

  // Feature 3: Trial
  setTrial: (tenantId: string, data: { trialEndsAt: string }) => api.put(`/tenants/${tenantId}/trial`, data),
  convertPlan: (tenantId: string, data: { plan: string }) => api.put(`/tenants/${tenantId}/convert`, data),

  // Feature 4: Quota
  getQuota: (id: string) => api.get(`/tenants/${id}/quota`),
  updateQuota: (tenantId: string, data: { maxUsers?: number | null; maxGroups?: number | null }) => api.put(`/tenants/${tenantId}/quota`, data),
  getFeatures: (tenantId: string) => api.get(`/tenants/${tenantId}/features`),
  updateFeatures: (tenantId: string, data: Record<string, boolean>) => api.put(`/tenants/${tenantId}/features`, data),

  // Feature 5: Audit Log
  getAuditLogs: (params?: { tenantId?: string; action?: string; actorRole?: string; page?: number; limit?: number; startDate?: string; endDate?: string }) =>
    api.get('/tenants/audit-logs', { params }),

  // Feature 6: Export
  exportData: async (tenantId: string, type: 'users' | 'payments' | 'groups', filename: string) => {
    const response = await api.get(`/tenants/${tenantId}/export`, { params: { type }, responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  // Feature 7: Broadcast
  broadcast: (data: { title: string; message: string; tenantIds?: string[] }) => api.post('/tenants/broadcast', data),

  // Feature 8: Support Tickets
  getSupportTickets: (params?: { tenantId?: string; status?: string; type?: string; page?: number; limit?: number }) =>
    api.get('/tenants/support-tickets', { params }),
  acceptSupportTicket: (ticketId: string) => api.put(`/tenants/support-tickets/${ticketId}/accept`),

  // Feature 9: Plan Settings
  getPlanSettings: () => api.get('/tenants/plan-settings'),
  updatePlanSettings: (data: Record<string, { price: number; currency: string; description: string; maxUsers: number; maxGroups: number }>) =>
    api.put('/tenants/plan-settings', data),

  // Feature 10: Health Monitoring
  getHealth: () => api.get('/tenants/health'),
}

// ─── TEST BAZA ────────────────────────────────────────────────────────────────

export type TestBazaQuestionPayload = {
  text?: string
  image?: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionAImage?: string
  optionBImage?: string
  optionCImage?: string
  optionDImage?: string
  correct: 'A' | 'B' | 'C' | 'D'
  difficulty?: 1 | 2 | 3
  timeLimitSeconds?: number
}

export const testBazaApi = {
  // Papkalar
  getContents: (folderId?: string) =>
    api.get('/test-baza/contents', folderId ? { params: { folderId } } : undefined),
  getAncestors: (folderId: string) =>
    api.get(`/test-baza/folders/${folderId}/ancestors`),
  createFolder: (data: { name: string; parentId?: string }) =>
    api.post('/test-baza/folders', data),
  updateFolder: (id: string, data: { name?: string; parentId?: string }) =>
    api.patch(`/test-baza/folders/${id}`, data),
  deleteFolder: (id: string) =>
    api.delete(`/test-baza/folders/${id}`),

  // Quizlar
  getQuiz: (id: string) =>
    api.get(`/test-baza/quizzes/${id}`),
  createQuiz: (data: { title: string; folderId?: string; description?: string; icon?: string; color?: string }) =>
    api.post('/test-baza/quizzes', data),
  updateQuiz: (id: string, data: { title?: string; description?: string; icon?: string; color?: string; isActive?: boolean; maxAttempts?: number }) =>
    api.patch(`/test-baza/quizzes/${id}`, data),
  copyQuiz: (id: string, data: { targetFolderId: string }) =>
    api.post(`/test-baza/quizzes/${id}/copy`, data),
  moveQuiz: (id: string, data: { targetFolderId: string }) =>
    api.patch(`/test-baza/quizzes/${id}/move`, data),
  deleteQuiz: (id: string) =>
    api.delete(`/test-baza/quizzes/${id}`),

  // Savollar
  addQuestion: (quizId: string, data: TestBazaQuestionPayload) =>
    api.post(`/test-baza/quizzes/${quizId}/questions`, data),
  bulkImportQuestions: (quizId: string, data: { questions: Partial<TestBazaQuestionPayload>[] }) =>
    api.post(`/test-baza/quizzes/${quizId}/questions/bulk`, data),
  updateQuestion: (id: string, data: Partial<TestBazaQuestionPayload>) =>
    api.patch(`/test-baza/questions/${id}`, data),
  reorderQuestions: (quizId: string, data: { orderedIds: string[] }) =>
    api.patch(`/test-baza/quizzes/${quizId}/questions/reorder`, data),
  deleteQuestion: (id: string) =>
    api.delete(`/test-baza/questions/${id}`),
}

export const announcementsApi = {
  create: (data: any) => api.post('/announcements', data),
  getAll: () => api.get('/announcements'),
  getMy: () => api.get('/announcements/my'),
  getUnread: (config?: { signal?: AbortSignal }) => api.get('/announcements/unread', config),
  markRead: (id: string) => api.post(`/announcements/${id}/read`),
  update: (id: string, data: any) => api.patch(`/announcements/${id}`, data),
  remove: (id: string) => api.delete(`/announcements/${id}`),
  getReads: (id: string) => api.get(`/announcements/${id}/reads`),
}

export const shopApi = {
  getItems: () => api.get('/shop/items'),
  createItem: (data: any) => api.post('/shop/items', data),
  updateItem: (id: string, data: any) => api.patch(`/shop/items/${id}`, data),
  deleteItem: (id: string) => api.delete(`/shop/items/${id}`),
  buyItem: (itemId: string) => api.post(`/shop/orders/${itemId}`),
  getMyOrders: () => api.get('/shop/orders/my'),
  getAllOrders: () => api.get('/shop/orders'),
  updateOrderStatus: (id: string, data: { status: string; adminNote?: string }) =>
    api.patch(`/shop/orders/${id}/status`, data),
}

export const gameManagerApi = {
  getQuestions: (params: { category?: string; gameMode?: string; page?: number; limit?: number } = {}) =>
    api.get('/game-manager/questions', { params }),
  getCategories: () => api.get('/game-manager/questions/categories'),
  getStats: () => api.get('/game-manager/questions/stats'),
  createQuestion: (data: { text: string; options: string[]; correct: number; category?: string; gameMode?: string }) =>
    api.post('/game-manager/questions', data),
  updateQuestion: (id: string, data: Partial<{ text: string; options: string[]; correct: number; category: string; gameMode: string; isActive: boolean }>) =>
    api.patch(`/game-manager/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/game-manager/questions/${id}`),
  bulkImport: (questions: { text: string; options: string[]; correct: number; category?: string; gameMode?: string }[]) =>
    api.post('/game-manager/questions/bulk', { questions }),
}

export const chemistryApi = {
  getMyStats: () => api.get('/chemistry/stats'),
  saveSolo: (data: { mode: 'TIME_ATTACK' | 'SURVIVAL'; score: number; totalQ: number; timeTaken?: number }) =>
    api.post('/chemistry/solo', data),
}

export const aiDataApi = {
  getStudentScores: (userId: string, period: 'weekly' | 'monthly') =>
    api.get(`/ai-data/students/${userId}/scores`, { params: { period } }),
}

export const complaintsApi = {
  create: (data: {
    studentId: string
    groupId: string
    lessonId?: string
    category: string
    description?: string
  }) => api.post('/complaints', data),
  getMyChild: () => api.get('/complaints/my-child'),
}

export const parentApi = {
  getMyChild: () => api.get('/parent/my-child'),
  getChildAttendance: (params?: { month?: number; year?: number }) =>
    api.get('/parent/attendance', { params }),
  getChildPayments: () => api.get('/parent/payments'),
  getChildHomework: () => api.get('/parent/homework'),
}
