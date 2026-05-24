import { homeworkApi } from './api'

export interface UiNotification {
  id: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
  source: 'server'
  href?: string | null
}

export function countUnreadNotifications(items: UiNotification[]): number {
  return items.filter((item) => !item.isRead).length
}

function normalizeText(value: string): string {
  return value.toLowerCase()
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle))
}

interface StudentHomeworkLookupItem {
  id: string
  groupId: string
  title: string
}

let studentHomeworkLookupPromise: Promise<StudentHomeworkLookupItem[]> | null = null

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[“”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractQuotedTitle(value: string): string | null {
  const match = value.match(/["“](.+?)["”]/)
  return match?.[1]?.trim() || null
}

function shouldResolveSpecificHomework(input: Pick<UiNotification, 'title' | 'message'>): boolean {
  const content = normalizeText(`${input.title} ${input.message}`)
  const quotedTitle = extractQuotedTitle(input.message)
  if (!quotedTitle) return false

  return includesAny(content, [
    'vazifa',
    'uyga vazifa',
    'homework',
    'assignment',
    'testi',
    'test ',
    'quiz',
    'tekshirildi',
    'checked',
    'proveren',
    'muddati',
    'deadline',
    'berildi',
    'topshirdi',
  ])
}

async function loadStudentHomeworkLookup(): Promise<StudentHomeworkLookupItem[]> {
  if (!studentHomeworkLookupPromise) {
    studentHomeworkLookupPromise = homeworkApi.getMy()
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : []
        return items
          .map((item: any) => ({
            id: String(item?.id ?? ''),
            groupId: String(item?.groupId ?? ''),
            title: String(item?.title ?? ''),
          }))
          .filter((item) => item.id && item.groupId && item.title)
      })
      .catch(() => [])
      .finally(() => {
        studentHomeworkLookupPromise = null
      })
  }

  return studentHomeworkLookupPromise
}

export async function resolveStudentNotificationHref(
  input: Pick<UiNotification, 'title' | 'message' | 'href'>,
): Promise<string | null> {
  if (shouldResolveSpecificHomework(input)) {
    const quotedTitle = extractQuotedTitle(input.message)
    if (quotedTitle) {
      const normalizedQuotedTitle = normalizeTitle(quotedTitle)
      const homeworks = await loadStudentHomeworkLookup()
      const matchedHomework = homeworks.find(
        (item) => normalizeTitle(item.title) === normalizedQuotedTitle,
      )

      if (matchedHomework) {
        return `/student/groups/${matchedHomework.groupId}?homeworkId=${matchedHomework.id}`
      }
    }
  }

  return input.href ?? inferStudentNotificationHref(input)
}

export function inferStudentNotificationHref(input: Pick<UiNotification, 'title' | 'message'>): string | null {
  const content = normalizeText(`${input.title} ${input.message}`)

  if (
    includesAny(content, [
      'to\'lov',
      'tolov',
      'payment',
      'oplata',
      'qarz',
      'debt',
    ])
  ) {
    return '/student/payments'
  }

  if (
    includesAny(content, [
      'vazifa',
      'uyga vazifa',
      'topshir',
      'tekshir',
      'deadline',
      'muddat',
      'homework',
      'assignment',
      'zadani',
    ])
  ) {
    return '/student/homework?tab=homework'
  }

  if (
    includesAny(content, [
      'test',
      'quiz',
      'savol',
      'attempt',
      'sertifikat',
      'certificate',
      'natija',
      'rezultat',
    ])
  ) {
    return '/student/homework?tab=extra'
  }

  if (
    includesAny(content, [
      'davomat',
      'attendance',
      'posesh',
      'qatnash',
      'darsga keldi',
      'bonus',
      'xp',
    ])
  ) {
    return '/student/homework?tab=attendance'
  }

  if (
    includesAny(content, [
      'oy o\'qituvchisi',
      'oyning eng yaxshi o\'qituvchisi',
      'eng yaxshi o\'qituvchi',
      'o\'qituvchingizga ovoz',
      'teacher of month',
      'best teacher',
      'vote for the best teacher',
      'лучшего преподавателя',
      'лучший преподаватель',
      'проголосуйте за',
    ])
  ) {
    return '/student/groups'
  }

  if (
    includesAny(content, [
      'guruh',
      'group',
      'raspisanie',
      'schedule',
      'jadval',
    ])
  ) {
    return '/student/groups'
  }

  return null
}
