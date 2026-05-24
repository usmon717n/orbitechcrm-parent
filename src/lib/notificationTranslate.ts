type Lang = 'uz' | 'ru' | 'en'

const TITLE_MAP: Record<string, { ru: string; en: string }> = {
  // ── Homework / Quiz ───────────────────────────────────────────────────────
  'Test topshirildi':                      { ru: 'Тест сдан',                          en: 'Quiz Submitted' },
  'Vazifa topshirildi':                    { ru: 'Задание сдано',                       en: 'Assignment Submitted' },
  'Test tekshirildi':                      { ru: 'Тест проверен',                       en: 'Quiz Graded' },
  'Vazifa tekshirildi':                    { ru: 'Задание проверено',                   en: 'Assignment Graded' },
  'Yangi vazifa berildi':                  { ru: 'Новое задание',                       en: 'New Assignment' },
  'Yangi nazorat ishi berildi':            { ru: 'Новая контрольная работа',            en: 'New Control Work' },
  'Vazifani qayta ishlang':                { ru: 'Доработайте задание',                 en: 'Revise Assignment' },

  // ── Deadline reminders ────────────────────────────────────────────────────
  'Shoshiling':                            { ru: 'Поторопитесь',                        en: 'Hurry Up' },
  'Vazifa muddati yaqin':                  { ru: 'Дедлайн скоро',                       en: 'Deadline Soon' },

  // ── Group ─────────────────────────────────────────────────────────────────
  'Guruh yakunlandi':                      { ru: 'Группа завершена',                    en: 'Group Ended' },

  // ── Attendance (student) ─────────────────────────────────────────────────
  'Darsda qatnashganingiz uchun rahmat! 🎉': { ru: 'Спасибо за посещение! 🎉',          en: 'Thanks for Attending! 🎉' },
  'Siz bugun darsga kelmadingiz':          { ru: 'Вы пропустили урок',                  en: 'You Missed the Class' },
  'Siz darsga kech qoldingiz':             { ru: 'Вы опоздали на урок',                 en: 'You Were Late' },
  'Davomat uchun XP':                      { ru: 'XP за посещаемость',                  en: 'XP for Attendance' },

  // ── Attendance (parent) ───────────────────────────────────────────────────
  'Farzandingiz darsga keldi ✅':          { ru: 'Ваш ребёнок пришёл на урок ✅',       en: 'Your Child Attended ✅' },
  'Farzandingiz darsga kelmadi ❌':        { ru: 'Ваш ребёнок пропустил урок ❌',       en: 'Your Child Missed Class ❌' },
  'Farzandingiz darsga kech qoldi ⚠️':    { ru: 'Ваш ребёнок опоздал ⚠️',            en: 'Your Child Was Late ⚠️' },

  // ── Homework (parent) ─────────────────────────────────────────────────────
  'Farzandingizga nazorat ishi berildi 📝': { ru: 'Контрольная работа 📝',              en: 'Control Work Assigned 📝' },
  'Farzandingizga uy vazifasi berildi 📚': { ru: 'Домашнее задание 📚',                en: 'Homework Assigned 📚' },
  'Farzandingiz test topshirdi 📊':        { ru: 'Ваш ребёнок сдал тест 📊',           en: 'Child Submitted Quiz 📊' },
  'Farzandingiz vazifa topshirdi ✅':      { ru: 'Ваш ребёнок сдал задание ✅',        en: 'Child Submitted Task ✅' },

  // ── Shop ──────────────────────────────────────────────────────────────────
  'Buyurtma qabul qilindi! 🛍️':           { ru: 'Заказ принят! 🛍️',                  en: 'Order Received! 🛍️' },

  // ── Chemistry battle ─────────────────────────────────────────────────────
  'Kimyo Jangi taklifi ⚗️':               { ru: 'Вызов на Хим. Битву ⚗️',             en: 'Chemistry Battle Invite ⚗️' },
}

type Pattern = { uz: RegExp; ru: string; en: string }

// $1, $2 … placeholders map to regex capture groups
const PATTERNS: Pattern[] = [

  // ── Parent: child submitted quiz ─────────────────────────────────────────
  // "StudentName "QuizTitle" testini topshirdi: N/M to'g'ri"
  // Must come BEFORE the teacher pattern which also starts with a name.
  {
    uz: /^(.+?) "(.+?)" testini topshirdi: (.+?) to['ʼ']g['ʼ']ri$/,
    ru: '$1 сдал(а) тест «$2»: $3 правильных',
    en: '$1 submitted quiz "$2": $3 correct',
  },

  // ── Parent: child submitted homework successfully ─────────────────────────
  // "StudentName "HwTitle" vazifasini muvaffaqiyatli topshirdi"
  // Must come BEFORE the teacher "vazifasini topshirdi" pattern.
  {
    uz: /^(.+?) "(.+?)" vazifasini muvaffaqiyatli topshirdi$/,
    ru: '$1 успешно сдал(а) задание «$2»',
    en: '$1 successfully submitted "$2"',
  },

  // ── Teacher: student submitted quiz ──────────────────────────────────────
  // "Ism Familiya "QuizTitle" testini topshirdi: 2/5"
  {
    uz: /^(.+?) "(.+?)" testini topshirdi: (.+)$/,
    ru: '$1 сдал(а) тест «$2»: $3',
    en: '$1 submitted quiz "$2": $3',
  },

  // ── Teacher: student submitted homework ──────────────────────────────────
  // "Ism Familiya "HwTitle" vazifasini topshirdi"
  {
    uz: /^(.+?) "(.+?)" vazifasini topshirdi$/,
    ru: '$1 сдал(а) задание «$2»',
    en: '$1 submitted assignment "$2"',
  },

  // ── Student: quiz auto-graded WITH XP ────────────────────────────────────
  // ""QuizTitle" testi tekshirildi: N/M to'g'ri. XP: +Z[ (psixologik...)]"
  // Must be BEFORE the no-XP variant so the more specific pattern wins.
  {
    uz: /^"(.+?)" testi tekshirildi: (.+?) to['ʼ']g['ʼ']ri\. XP: \+(\d+)/,
    ru: 'Тест «$1» проверен: $2 правильных. XP: +$3',
    en: 'Quiz "$1" graded: $2 correct. XP: +$3',
  },

  // ── Student: quiz auto-graded WITHOUT XP ─────────────────────────────────
  // ""QuizTitle" testi tekshirildi: N/M to'g'ri"
  {
    uz: /^"(.+?)" testi tekshirildi: (.+?) to['ʼ']g['ʼ']ri$/,
    ru: 'Тест «$1» проверен: $2 правильных',
    en: 'Quiz "$1" graded: $2 correct',
  },

  // ── Student: homework submitted successfully ──────────────────────────────
  // ""HwTitle" vazifasini muvaffaqiyatli topshirdingiz"
  {
    uz: /^"(.+?)" vazifasini muvaffaqiyatli topshirdingiz$/,
    ru: 'Вы успешно сдали задание «$1»',
    en: 'You successfully submitted "$1"',
  },

  // ── Student: homework graded by teacher (Ball + XP) ───────────────────────
  // ""HwTitle" tekshirildi. Ball: X/Y. XP: +Z[ (psixologik...)]"
  // No $ anchor so the optional psych note at the end is silently ignored.
  {
    uz: /^"(.+?)" tekshirildi\. Ball: (.+?)\. XP: \+(\d+)/,
    ru: '«$1» проверено. Балл: $2. XP: +$3',
    en: '"$1" graded. Score: $2. XP: +$3',
  },

  // ── Student: homework needs revision ─────────────────────────────────────
  // ""HwTitle" qayta ishlash kerak: <feedback>"
  {
    uz: /^"(.+?)" qayta ishlash kerak: (.+)$/,
    ru: '«$1» требует доработки: $2',
    en: '"$1" needs revision: $2',
  },

  // ── Student: attendance confirmed (present) ───────────────────────────────
  // "GroupName — LessonTitle darsida qatnashganingiz qayd etildi."
  {
    uz: /^(.+?) — (.+?) darsida qatnashganingiz qayd etildi\.$/,
    ru: '$1 — посещение «$2» зафиксировано.',
    en: '$1 — your attendance at "$2" has been recorded.',
  },

  // ── Student: missed class ─────────────────────────────────────────────────
  // "GroupName — LessonTitle darsiga kelmadingiz. N XP ayrildi."
  {
    uz: /^(.+?) — (.+?) darsiga kelmadingiz\. (\d+) XP ayrildi\.$/,
    ru: '$1 — вы пропустили «$2». −$3 XP.',
    en: '$1 — you missed "$2". −$3 XP.',
  },

  // ── Student: late to class ────────────────────────────────────────────────
  // "GroupName — LessonTitle darsiga kech keldingiz. N XP ayrildi."
  {
    uz: /^(.+?) — (.+?) darsiga kech keldingiz\. (\d+) XP ayrildi\.$/,
    ru: '$1 — вы опоздали на «$2». −$3 XP.',
    en: '$1 — you were late to "$2". −$3 XP.',
  },

  // ── Student: XP for attendance ───────────────────────────────────────────
  // "GroupName — LessonTitle darsida qatnashganingiz uchun +N XP berildi"
  {
    uz: /^(.+?) — (.+?) darsida qatnashganingiz uchun \+(\d+) XP berildi$/,
    ru: '$1 — за посещение «$2» начислено +$3 XP',
    en: '$1 — +$3 XP earned for attending "$2"',
  },

  // ── Parent: child attended class ─────────────────────────────────────────
  // "StudentName — GroupName "LessonTitle" darsida qatnashdi."
  {
    uz: /^(.+?) — (.+?) "(.+?)" darsida qatnashdi\.$/,
    ru: '$1 — присутствовал(а) на уроке «$3» (гр. $2).',
    en: '$1 attended "$3" ($2).',
  },

  // ── Parent: child missed class ────────────────────────────────────────────
  // "StudentName — GroupName "LessonTitle" darsiga kelmadi."
  {
    uz: /^(.+?) — (.+?) "(.+?)" darsiga kelmadi\.$/,
    ru: '$1 — не пришёл(а) на урок «$3» (гр. $2).',
    en: '$1 missed "$3" ($2).',
  },

  // ── Parent: child late to class ───────────────────────────────────────────
  // "StudentName — GroupName "LessonTitle" darsiga kech keldi."
  {
    uz: /^(.+?) — (.+?) "(.+?)" darsiga kech keldi\.$/,
    ru: '$1 — опоздал(а) на урок «$3» (гр. $2).',
    en: '$1 was late to "$3" ($2).',
  },

  // ── Parent: new control work assigned ────────────────────────────────────
  // "GroupName guruhida yangi nazorat ishi: "HwTitle""
  {
    uz: /^(.+?) guruhida yangi nazorat ishi: "(.+?)"$/,
    ru: 'В группе $1 новая контрольная: «$2»',
    en: 'New control work in $1: "$2"',
  },

  // ── Parent: new homework assigned ────────────────────────────────────────
  // "GroupName guruhida yangi uy vazifasi: "HwTitle""
  {
    uz: /^(.+?) guruhida yangi uy vazifasi: "(.+?)"$/,
    ru: 'В группе $1 новое домашнее задание: «$2»',
    en: 'New homework in $1: "$2"',
  },

  // ── Student: new control work ────────────────────────────────────────────
  // ""HwTitle" nazorat ishi berildi"
  {
    uz: /^"(.+?)" nazorat ishi berildi$/,
    ru: 'Выдана контрольная работа «$1»',
    en: 'New control work: "$1"',
  },

  // ── Student: new homework ─────────────────────────────────────────────────
  // ""HwTitle" vazifasi berildi"
  {
    uz: /^"(.+?)" vazifasi berildi$/,
    ru: 'Выдано задание «$1»',
    en: 'New assignment: "$1"',
  },

  // ── Group ended (teacher) ─────────────────────────────────────────────────
  // ""GroupName" guruhi rasman yakunlandi. Barcha yozuvlar saqlab qolindi."
  {
    uz: /^"(.+?)" guruhi rasman yakunlandi\. Barcha yozuvlar saqlab qolindi\.$/,
    ru: 'Группа «$1» официально завершена. Все записи сохранены.',
    en: 'Group "$1" has officially ended. All records saved.',
  },

  // ── Group ended (admin) ───────────────────────────────────────────────────
  // ""GroupName" guruhi yakunlandi. N ta o'quvchi enrollment'i yopildi."
  {
    uz: /^"(.+?)" guruhi yakunlandi\. (\d+) ta o['ʼ']quvchi enrollment'i yopildi\.$/,
    ru: 'Группа «$1» завершена. Закрыты записи $2 учеников.',
    en: 'Group "$1" ended. $2 student enrollments closed.',
  },

  // ── Deadline: 1 hour left ─────────────────────────────────────────────────
  {
    uz: /^"(.+?)" vazifasi muddati tugashiga taxminan 1 soat qoldi$/,
    ru: 'До дедлайна «$1» остался около 1 часа',
    en: 'About 1 hour left until the deadline for "$1"',
  },

  // ── Deadline: 2 hours left ────────────────────────────────────────────────
  {
    uz: /^"(.+?)" vazifasi muddati tugashiga taxminan 2 soat qoldi$/,
    ru: 'До дедлайна «$1» осталось около 2 часов',
    en: 'About 2 hours left until the deadline for "$1"',
  },

  // ── Deadline: 5 hours left ────────────────────────────────────────────────
  {
    uz: /^"(.+?)" vazifasi muddati tugashiga taxminan 5 soat qoldi$/,
    ru: 'До дедлайна «$1» осталось около 5 часов',
    en: 'About 5 hours left until the deadline for "$1"',
  },

  // ── Deadline: 50 % passed ─────────────────────────────────────────────────
  {
    uz: /^"(.+?)" vazifasining yarmi o['ʼ']tdi, tez bajarib topshiring$/,
    ru: 'Половина срока «$1» истекла — поторопитесь сдать',
    en: 'Half the time for "$1" is gone — submit soon',
  },

  // ── Shop: order placed ────────────────────────────────────────────────────
  // ""ItemName" uchun buyurtmangiz qabul qilindi. −N 🪙 tanga. Admin tasdiqlashini kuting."
  {
    uz: /^"(.+?)" uchun buyurtmangiz qabul qilindi\..+tanga\. Admin tasdiqlashini kuting\.$/,
    ru: 'Заказ «$1» принят. Ожидайте подтверждения.',
    en: 'Order for "$1" placed. Awaiting admin confirmation.',
  },

  // ── Chemistry Battle: invite ──────────────────────────────────────────────
  // "FN LN sizni Kimyo Jangiga taklif qilmoqda. Ilovaga kiring va qabul qiling!"
  {
    uz: /^(.+?) sizni Kimyo Jangiga taklif qilmoqda\. Ilovaga kiring va qabul qiling!$/,
    ru: '$1 вызывает вас на Химическую Битву. Откройте приложение, чтобы принять вызов!',
    en: '$1 is challenging you to a Chemistry Battle. Open the app to accept!',
  },

  // ── Parent: complaint notification (title) ────────────────────────────────
  // "⚠️ StudentName haqida shikoyat"
  {
    uz: /^⚠️ (.+?) haqida shikoyat$/,
    ru: '⚠️ Жалоба на $1',
    en: '⚠️ Complaint about $1',
  },

  // ── Parent: complaint notification (message) ──────────────────────────────
  // "TeacherName (GroupName): CategoryLabel[ — description]"
  {
    uz: /^(.+?) \((.+?)\): (.+)$/,
    ru: '$1 ($2): $3',
    en: '$1 ($2): $3',
  },
]

function applyPattern(text: string, pattern: Pattern, lang: 'ru' | 'en'): string | null {
  const match = text.match(pattern.uz)
  if (!match) return null
  const template = lang === 'ru' ? pattern.ru : pattern.en
  return template.replace(/\$(\d+)/g, (_, i) => match[Number(i)] ?? '')
}

export function translateNotification(
  title: string,
  message: string,
  lang: Lang,
): { title: string; message: string } {
  if (lang === 'uz') return { title, message }

  const mapped = TITLE_MAP[title]
  let translatedTitle = mapped ? mapped[lang] : title
  // Dynamic title patterns (e.g. complaint "⚠️ Name haqida shikoyat")
  if (!mapped) {
    for (const pattern of PATTERNS) {
      const result = applyPattern(title, pattern, lang)
      if (result !== null) { translatedTitle = result; break }
    }
  }

  let translatedMessage = message
  for (const pattern of PATTERNS) {
    const result = applyPattern(message, pattern, lang)
    if (result !== null) {
      translatedMessage = result
      break
    }
  }

  return { title: translatedTitle, message: translatedMessage }
}

const UZ_MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']
const RU_MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatNotificationDate(date: string, lang: Lang): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return date

  const now = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const time = `${hh}:${mm}`

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()

  if (isToday) return time

  const months = lang === 'ru' ? RU_MONTHS : lang === 'en' ? EN_MONTHS : UZ_MONTHS
  const mon = months[d.getMonth()]
  const day = d.getDate()
  const sameYear = d.getFullYear() === now.getFullYear()

  if (isYesterday) {
    const yLabel = lang === 'ru' ? 'Вчера' : lang === 'en' ? 'Yesterday' : 'Kecha'
    return `${yLabel} ${time}`
  }

  if (sameYear) return `${day} ${mon} ${time}`

  return `${day} ${mon} ${d.getFullYear()} ${time}`
}
