'use client'
import { useCallback } from 'react'
import { messages } from '@/i18n/messages'
import { useLangStore, type Language } from '@/store/lang.store'

function getByPath(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj)
}

export function useI18n() {
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)

  const t = useCallback((key: string, paramsOrFallback?: Record<string, any> | string, fallback?: string) => {
    const params = typeof paramsOrFallback === 'string' ? undefined : paramsOrFallback
    const resolvedFallback = typeof paramsOrFallback === 'string' ? paramsOrFallback : fallback
    let val = getByPath(messages[lang], key)
    
    // Fallback chain: Current Lang -> UZ -> EN
    if (typeof val !== 'string') {
      val = getByPath(messages.uz, key)
    }
    if (typeof val !== 'string') {
      val = getByPath(messages.en, key)
    }

    if (typeof val === 'string') {
      let result = val
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.split(`{${k}}`).join(String(v))
        })
      }
      return result
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Missing key: "${key}" in [${lang}, uz, en]`)
    }

    return resolvedFallback ?? key
  }, [lang])

  return { lang, setLang, t }
}

export function translateKnownTitle(
  title: string | undefined,
  t: (key: string, params?: Record<string, any>, fallback?: string) => string,
) {
  if (!title) return 'Orbitech CRM'

  const titleMap: Record<string, string> = {
    'Bosh sahifa': 'nav.home',
    'Главная': 'nav.home',
    Home: 'nav.home',
    Guruhlarim: 'nav.myGroups',
    'Мои группы': 'nav.myGroups',
    'My Groups': 'nav.myGroups',
    Guruhlar: 'nav.groups',
    'Группы': 'nav.groups',
    Groups: 'nav.groups',
    "O'quvchilar": 'nav.students',
    Студенты: 'nav.students',
    Students: 'nav.students',
    "O'qituvchilar": 'nav.teachers',
    Преподаватели: 'nav.teachers',
    Teachers: 'nav.teachers',
    "To'lovlar": 'nav.payments',
    Платежи: 'nav.payments',
    Payments: 'nav.payments',
    "To'lovlarim": 'nav.myPayments',
    'Мои платежи': 'nav.myPayments',
    'My Payments': 'nav.myPayments',
    Reyting: 'nav.ratings',
    Рейтинг: 'nav.ratings',
    Ratings: 'nav.ratings',
    "Oy o'qituvchisi": 'teacherOfMonth.navLabel',
    "Oyning eng yaxshi o'qituvchisi": 'teacherOfMonth.pageTitle',
    'Лучший преподаватель': 'teacherOfMonth.navLabel',
    'Лучший преподаватель месяца': 'teacherOfMonth.pageTitle',
    'Teacher of the Month': 'teacherOfMonth.pageTitle',
    Jadval: 'nav.schedule',
    Расписание: 'nav.schedule',
    Schedule: 'nav.schedule',
    Vaqt: 'nav.time',
    Время: 'nav.time',
    Time: 'nav.time',
    'Dars jadvali': 'nav.schedule',
    'Ko\'rsatkichlar': 'nav.indicators',
    Показатели: 'nav.indicators',
    Indicators: 'nav.indicators',
    "Ko'rsatkichlarim": 'nav.indicators',
    Testlar: 'nav.tests',
    Тесты: 'nav.tests',
    Tests: 'nav.tests',
    "Qo'shimcha darslar": 'nav.extraLessons',
    "Qo'shimcha": 'nav.extraLessons',
    'Доп. уроки': 'nav.extraLessons',
    Допы: 'nav.extraLessons',
    'Extra Lessons': 'nav.extraLessons',
    Extra: 'nav.extraLessons',
    Bildirishnomalar: 'nav.notifications',
    Уведомления: 'nav.notifications',
    Notifications: 'nav.notifications',
    'Xabar yuborish': 'nav.support',
    Murojaat: 'nav.support',
    Обращение: 'nav.support',
    Support: 'nav.support',
    Sozlamalar: 'nav.settings',
    Настройки: 'nav.settings',
    Settings: 'nav.settings',
    Guruh: 'nav.groups',
    Группа: 'nav.groups',
    Group: 'nav.groups',
    Test: 'nav.tests',
    Тест: 'nav.tests',
  }

  const key = titleMap[title]
  return key ? t(key, undefined, title) : title
}

export const LANG_OPTIONS: { value: Language; labelKey: string }[] = [
  { value: 'uz', labelKey: 'language.uz' },
  { value: 'ru', labelKey: 'language.ru' },
  { value: 'en', labelKey: 'language.en' },
]
