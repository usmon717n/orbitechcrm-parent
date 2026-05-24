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
  teacherGroups: true,
  teacherTime: true,
  teacherTests: true,
  teacherNotifications: true,
  studentGroups: true,
  studentPayments: true,
  studentHomework: true,
  studentRatings: true,
  studentExtraLessons: true,
  studentNotifications: true,
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
      { key: 'adminFinance', label: 'Moliya', description: 'Admin moliya hisobotlarini ko‘radi' },
      { key: 'adminRatings', label: 'Reyting', description: 'Admin reyting bo‘limini ko‘radi' },
      { key: 'adminReports', label: 'Hisobotlar', description: 'Admin hisobotlar sahifasiga kiradi' },
      { key: 'adminNotifications', label: 'Bildirishnomalar', description: 'Admin xabarlar va survey bo‘limini ko‘radi' },
      { key: 'adminSupport', label: 'Yordam', description: 'Admin superadminga murojaat yuboradi' },
      { key: 'adminAudit', label: 'Audit log', description: 'Admin audit log bo‘limini ko‘radi' },
      { key: 'adminNotes', label: 'Eslatmalar', description: 'Admin notes bo‘limini ko‘radi' },
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
  { role: 'ADMIN', prefix: '/admin/support', feature: 'adminSupport' },
  { role: 'ADMIN', prefix: '/admin/audit', feature: 'adminAudit' },
  { role: 'ADMIN', prefix: '/admin/notes', feature: 'adminNotes' },
  { role: 'TEACHER', prefix: '/teacher/groups', feature: 'teacherGroups' },
  { role: 'TEACHER', prefix: '/teacher/time', feature: 'teacherTime' },
  { role: 'TEACHER', prefix: '/teacher/tests', feature: 'teacherTests' },
  { role: 'TEACHER', prefix: '/teacher/notifications', feature: 'teacherNotifications' },
  { role: 'STUDENT', prefix: '/student/groups', feature: 'studentGroups' },
  { role: 'STUDENT', prefix: '/student/payments', feature: 'studentPayments' },
  { role: 'STUDENT', prefix: '/student/homework', feature: 'studentHomework' },
  { role: 'STUDENT', prefix: '/student/ratings', feature: 'studentRatings' },
  { role: 'STUDENT', prefix: '/student/extra', feature: 'studentExtraLessons' },
  { role: 'STUDENT', prefix: '/student/notifications', feature: 'studentNotifications' },
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
