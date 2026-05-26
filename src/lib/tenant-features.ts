import type { Role } from '@/types'

export const DEFAULT_TENANT_FEATURES = {
  adminStudents: true,
  adminTeachers: true,
  adminGroups: true,
  adminPayments: true,
  adminFinance: true,
  adminRatings: true,
  adminReports: true,
  adminNotifications: true,
  adminSupport: true,
  adminAudit: true,
  adminNotes: true,
  adminAnnouncements: true,
  adminTests: true,
  adminGames: true,
  adminShop: true,
  adminStatistics: true,
  adminTeacherOfMonth: true,
  teacherGroups: true,
  teacherTime: true,
  teacherTests: true,
  teacherNotifications: true,
  teacherSupport: true,
  studentGroups: true,
  studentPayments: true,
  studentHomework: true,
  studentRatings: true,
  studentExtraLessons: true,
  studentNotifications: true,
  studentSchedule: true,
  studentSupport: true,
} as const

export type TenantFeatures = { [K in keyof typeof DEFAULT_TENANT_FEATURES]: boolean }
export type TenantFeatureKey = keyof TenantFeatures

export type TenantFeatureGroup = {
  id: 'admin' | 'teacher' | 'student'
  title: string
  items: Array<{ key: TenantFeatureKey; label: string; description: string }>
}

export const TENANT_FEATURE_GROUPS: TenantFeatureGroup[] = [
  {
    id: 'admin',
    title: 'Admin modullari',
    items: [
      { key: 'adminStudents', label: "O'quvchilar", description: "Admin o'quvchilar bo'limini ko'radi" },
      { key: 'adminTeachers', label: "O'qituvchilar", description: "Admin o'qituvchilar bo'limini ko'radi" },
      { key: 'adminGroups', label: 'Guruhlar', description: 'Admin guruhlarni boshqaradi' },
      { key: 'adminPayments', label: "To'lovlar", description: "Admin to'lovlar moduliga kiradi" },
      { key: 'adminFinance', label: 'Moliya', description: "Admin moliya hisobotlarini ko'radi" },
      { key: 'adminRatings', label: 'Reyting', description: "Admin reyting bo'limini ko'radi" },
      { key: 'adminReports', label: 'Hisobotlar', description: 'Admin hisobotlar sahifasiga kiradi' },
      { key: 'adminNotifications', label: 'Bildirishnomalar', description: "Admin xabarlar va survey bo'limini ko'radi" },
      { key: 'adminAnnouncements', label: "E'lonlar", description: "Admin e'lonlar modulini ko'radi" },
      { key: 'adminTests', label: 'Testlar', description: 'Admin test va savollar modulini boshqaradi' },
      { key: 'adminGames', label: "O'yinlar", description: "Admin kimyo jangi va gamification modulini ko'radi" },
      { key: 'adminShop', label: "Do'kon", description: "Admin do'kon va sovg'alar modulini ko'radi" },
      { key: 'adminStatistics', label: 'Statistika', description: "Admin kengaytirilgan statistika sahifasini ko'radi" },
      { key: 'adminTeacherOfMonth', label: "Oy o'qituvchisi", description: "Admin oy o'qituvchisi modulini boshqaradi" },
      { key: 'adminSupport', label: 'Yordam', description: 'Admin superadminga murojaat yuboradi' },
      { key: 'adminAudit', label: 'Audit log', description: "Admin audit log bo'limini ko'radi" },
      { key: 'adminNotes', label: 'Eslatmalar', description: "Admin notes bo'limini ko'radi" },
    ],
  },
  {
    id: 'teacher',
    title: "O'qituvchi modullari",
    items: [
      { key: 'teacherGroups', label: 'Guruhlar', description: "O'qituvchi guruhlarini ko'radi" },
      { key: 'teacherTime', label: 'Vaqt', description: "O'qituvchi vaqt/statistika bo'limini ko'radi" },
      { key: 'teacherTests', label: 'Testlar', description: "O'qituvchi test moduliga kiradi" },
      { key: 'teacherNotifications', label: 'Bildirishnomalar', description: "O'qituvchi xabarlar sahifasini ko'radi" },
      { key: 'teacherSupport', label: 'Yordam', description: "O'qituvchi support sahifasini ko'radi" },
    ],
  },
  {
    id: 'student',
    title: "O'quvchi modullari",
    items: [
      { key: 'studentGroups', label: 'Guruhlar', description: "O'quvchi o'z guruhlarini ko'radi" },
      { key: 'studentPayments', label: "To'lovlar", description: "O'quvchi to'lovlar sahifasini ko'radi" },
      { key: 'studentHomework', label: 'Natijalar/Homework', description: "O'quvchi vazifa va natijalar bo'limini ko'radi" },
      { key: 'studentRatings', label: 'Reyting', description: "O'quvchi reytinglar bo'limini ko'radi" },
      { key: 'studentExtraLessons', label: "Qo'shimcha darslar", description: "O'quvchi extra lessons/testlar bo'limiga kiradi" },
      { key: 'studentNotifications', label: 'Bildirishnomalar', description: "O'quvchi xabarlar sahifasini ko'radi" },
      { key: 'studentSchedule', label: 'Dars jadvali', description: "O'quvchi dars jadvalini ko'radi" },
      { key: 'studentSupport', label: 'Yordam', description: "O'quvchi support sahifasini ko'radi" },
    ],
  },
]

const ROUTE_FEATURES: Array<{ role: Role; prefix: string; feature: TenantFeatureKey }> = [
  { role: 'ADMIN', prefix: '/admin/students', feature: 'adminStudents' },
  { role: 'ADMIN', prefix: '/admin/teachers', feature: 'adminTeachers' },
  { role: 'ADMIN', prefix: '/admin/groups', feature: 'adminGroups' },
  { role: 'ADMIN', prefix: '/admin/payments', feature: 'adminPayments' },
  { role: 'ADMIN', prefix: '/admin/finance/debts', feature: 'adminPayments' },
  { role: 'ADMIN', prefix: '/admin/finance', feature: 'adminFinance' },
  { role: 'ADMIN', prefix: '/admin/ratings', feature: 'adminRatings' },
  { role: 'ADMIN', prefix: '/admin/reports', feature: 'adminReports' },
  { role: 'ADMIN', prefix: '/admin/notifications', feature: 'adminNotifications' },
  { role: 'ADMIN', prefix: '/admin/announcements', feature: 'adminAnnouncements' },
  { role: 'ADMIN', prefix: '/admin/tests', feature: 'adminTests' },
  { role: 'ADMIN', prefix: '/admin/games', feature: 'adminGames' },
  { role: 'ADMIN', prefix: '/admin/shop', feature: 'adminShop' },
  { role: 'ADMIN', prefix: '/admin/statistics', feature: 'adminStatistics' },
  { role: 'ADMIN', prefix: '/admin/teacher-of-month', feature: 'adminTeacherOfMonth' },
  { role: 'ADMIN', prefix: '/admin/support', feature: 'adminSupport' },
  { role: 'ADMIN', prefix: '/admin/audit', feature: 'adminAudit' },
  { role: 'ADMIN', prefix: '/admin/notes', feature: 'adminNotes' },
  { role: 'TEACHER', prefix: '/teacher/groups', feature: 'teacherGroups' },
  { role: 'TEACHER', prefix: '/teacher/time', feature: 'teacherTime' },
  { role: 'TEACHER', prefix: '/teacher/tests', feature: 'teacherTests' },
  { role: 'TEACHER', prefix: '/teacher/notifications', feature: 'teacherNotifications' },
  { role: 'TEACHER', prefix: '/teacher/support', feature: 'teacherSupport' },
  { role: 'STUDENT', prefix: '/student/groups', feature: 'studentGroups' },
  { role: 'STUDENT', prefix: '/student/payments', feature: 'studentPayments' },
  { role: 'STUDENT', prefix: '/student/homework', feature: 'studentHomework' },
  { role: 'STUDENT', prefix: '/student/ratings', feature: 'studentRatings' },
  { role: 'STUDENT', prefix: '/student/extra', feature: 'studentExtraLessons' },
  { role: 'STUDENT', prefix: '/student/notifications', feature: 'studentNotifications' },
  { role: 'STUDENT', prefix: '/student/schedule', feature: 'studentSchedule' },
  { role: 'STUDENT', prefix: '/student/support', feature: 'studentSupport' },
]

export function normalizeTenantFeatures(raw?: Partial<Record<TenantFeatureKey, unknown>> | null): TenantFeatures {
  const source = raw ?? {}
  return Object.fromEntries(
    Object.entries(DEFAULT_TENANT_FEATURES).map(([key, defaultValue]) => [key, typeof source[key as TenantFeatureKey] === 'boolean' ? source[key as TenantFeatureKey] : defaultValue]),
  ) as TenantFeatures
}

export function isTenantFeatureEnabled(features: Partial<TenantFeatures> | null | undefined, key: TenantFeatureKey): boolean {
  return normalizeTenantFeatures(features)[key]
}

export function getTenantFeatureForPath(role: Role, pathname: string): TenantFeatureKey | null {
  const match = ROUTE_FEATURES.find((item) => item.role === role && pathname.startsWith(item.prefix))
  return match?.feature ?? null
}
