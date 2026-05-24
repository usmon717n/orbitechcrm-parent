'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Activity, Target, Sparkles, Battery,
  Smile, TrendingUp, AlertCircle, ChevronDown, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid,
} from 'recharts'
import { studentsApi } from '@/lib/api'
import type { Language } from '@/store/lang.store'
import { Skeleton } from '@/components/Skeleton'
import { useSocketEvent } from '@/hooks/useSocketEvent'

interface PsychData {
  student: { firstName: string; lastName: string; xp: number; level: number }
  scores: { focus: number; motivation: number; consistency: number; confidence: number; stress: number }
  overall: { label: string; avg: number }
  trend: { name: string; date: string; consistency: number; stress: number }[]
  radar: { subject: string; value: number }[]
}


const SCORE_META = [
  { key: 'focus',       labelKey: 'parent.scoreFocus',       color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/30',       bar: '#3B82F6', invert: false },
  { key: 'motivation',  labelKey: 'parent.scoreMotivation',  color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950/30',   bar: '#A855F7', invert: false },
  { key: 'consistency', labelKey: 'parent.scoreConsistency', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', bar: '#10B981', invert: false },
  { key: 'confidence',  labelKey: 'parent.scoreConfidence',  color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30',    bar: '#F59E0B', invert: false },
  { key: 'stress',      labelKey: 'parent.scoreStress',      color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950/30',      bar: '#F43F5E', invert: false },
] as const

type Level = 'bad' | 'mid' | 'good'

function getLevel(value: number, invert = false): Level {
  const v = invert ? 100 - value : value
  if (v < 40) return 'bad'
  if (v < 65) return 'mid'
  return 'good'
}

type AdviceMap = Record<string, Record<Level, { title: string; text: string; icon: string }>>

const ADVICE_ALL: Record<Language, AdviceMap> = {
  uz: {
    focus: {
      bad:  { icon: '🔴', title: "E'tibor juda past — zudlik bilan choralar kerak", text: "Farzandingiz dars davomida diqqatini jamlashda jiddiy qiyinchilik boshdan kechiryapti. Bu ko'pincha uyqusizlik, telefondan ortiqcha foydalanish yoki ichki tashvishlar bilan bog'liq. Dars oldidan 10 daqiqa «raqamli detoks» qoidasini kiriting — telefon va gadjetlarni boshqa xonaga qo'ying. Uyqu rejimini tekshiring: 13–17 yoshdagi o'smirga kamida 8–9 soat uyqu zarur. Kechqurun ekran vaqtini keskin cheklang." },
      mid:  { icon: '🟡', title: "E'tibor o'rtacha — yaxshilash mumkin", text: "Farzandingiz ba'zan diqqatini jamlaydi, ba'zan chalg'iydi. «Pomodoro» usulini tavsiya eting: 25 daqiqa chuqur ishlash + 5 daqiqa tanaffus. Dars joyini tartibga keltiring — stolda faqat kerakli narsalar qolsin. Har kuni bir xil vaqtda o'qish odatini shakllantiring, chunki miya rutinaga moslashadi va diqqat avtomatik ravishda keskinlashadi." },
      good: { icon: '🟢', title: "E'tibor yaxshi — bu katta yutuq", text: "Farzandingiz diqqatini yaxshi boshqaryapti. Bu natijani saqlash uchun dam olish va faoliyat muvozanatiga e'tibor bering. Qiziqarli kitoblar yoki hujjatli filmlar bilan bilimini boyiting — bu diqqatni yanada kuchaytiradi va o'qish ishtiyoqini oshiradi." },
    },
    motivation: {
      bad:  { icon: '🔴', title: "Motivatsiya juda past — shoshilinch muloqot zarur", text: "Farzandingiz o'qishdan ichki qiziqishini yo'qotgan — bu jiddiy signal. Bugun kechqurun bosim o'tkazmasdan samimiy suhbat qurib ko'ring: «O'qishda nima qiyin? Nimani yaxshi ko'rasan?» deb so'rang va javobini diqqat bilan tinglang. Maqsad yo'qligi motivatsiya pasayishining asosiy sababi — birgalikda 1 oylik kichik maqsad tuzib, uni amalga oshirganda munosib sovg'a belgilang. Hech qachon «nima uchun o'qimaysan?» deb qoralamang." },
      mid:  { icon: '🟡', title: "Motivatsiya o'rtacha — alangani yoqing", text: "Farzandingizda motivatsiya bor, lekin u o'zgaruvchan. Uning erishgan natijalarini tan oling — ba'zida «bugungi ishingni ko'rdim, juda yaxshi» deyish kifoya. Kelajakdagi kasblar, muvaffaqiyatli odamlarning qiziqarli hayoti haqida suhbatlashing. Kelajak tasavvuri — eng kuchli motivator." },
      good: { icon: '🟢', title: "Motivatsiya yuqori — davom eting", text: "Farzandingiz o'qishga ishtiyoqli. Shu holatni saqlash uchun uning yutuqlarini muntazam nishonlab turing. Yangi, biroz qiyinroq maqsadlar qo'ying — odam doimo o'sib borsa, motivatsiya tushib ketmaydi. Undagi bu kuchni ko'rib turganingizni unga aytib turing." },
    },
    consistency: {
      bad:  { icon: '🔴', title: "Izchillik juda past — kun tartibi buzilgan", text: "Farzandingiz darslarni o'tkazib yubormoqda yoki vazifalarni bajarishda izchillik yo'q. Buning sababi ko'pincha aniq kundalik jadval yo'qligi. Birgalikda oddiy kun jadvalini tuzing: uyg'onish, ovqat, dars, dam olish vaqtlarini aniq belgilang. Birinchi 21 kun — odat shakllantirish davri — shu paytda maxsus e'tibor va qo'llab-quvvatlash bering." },
      mid:  { icon: '🟡', title: "Izchillik o'rtacha — tartibni mustahkamlang", text: "Farzandingiz ba'zi kunlar yaxshi ishlaydi, ba'zi kunlar emas. Haftalik natijalarni birga ko'rib chiqish odatini kiriting — yakshanba kechqurun 10 daqiqa: nima yaxshi bo'ldi, nimani yaxshilash kerak. Bu o'z-o'zini kuzatish ko'nikmasi hayoti davomida foydali bo'ladi." },
      good: { icon: '🟢', title: "Izchillik yaxshi — muvaffaqiyatning asosi", text: "Izchillik — muvaffaqiyatli odamlarning bosh xususiyati. Farzandingiz buni egallamoqda — bu juda kamdan-kam ko'riladi. Bu odatni yanada mustahkamlash uchun unga o'z progressini kuzatadigan daftar yoki ilova taqdim eting." },
    },
    confidence: {
      bad:  { icon: '🔴', title: "O'ziga ishonch juda past — ehtiyotkorlik zarur", text: "Farzandingiz o'zini qobiliyatsiz his qilishi mumkin. Bu juda nozik holat va noto'g'ri munosabat ahvolni yanada yomonlashtiradi. Uni hech qachon boshqalar bilan solishtirib qo'ymang. Kichik muvaffaqiyatlarni ham baland ovozda ta'riflab turing: «Bu juda qiyin edi, lekin sen qilding — men faxrlanaman». Agar bu holat uzoq davom etsa, maktab psixologiga murojaat qilishni o'ylab ko'ring." },
      mid:  { icon: '🟡', title: "O'ziga ishonch o'rtacha — rag'batlantirish vaqti", text: "Farzandingizda o'z kuchiga ishonch bor, lekin u hali to'liq rivojlanmagan. Unga mas'uliyatli topshiriqlar bering — uy ishlarida yordamchi bo'lsin, oilaviy qarorlarda fikri so'ralsin. Mas'uliyatni his etish o'z-o'ziga ishonchni oshirishning eng samarali yo'li." },
      good: { icon: '🟢', title: "O'ziga ishonch mustahkam — ajoyib asos", text: "Farzandingiz o'z kuchiga ishonadi. Bu uni qiyinchiliklarda chidamli va moslashuvchan qiladi. Ushbu ishonchni yanada mustahkamlash uchun uni yangi sohalarda sinashga undang: sport, san'at, jamoat faoliyati — har bir yangi soha yangi ishonch qo'shadi." },
    },
    stress: {
      bad:  { icon: '🔴', title: "Stress darajasi kritik — zudlik bilan harakat qiling", text: "Farzandingizda stress juda yuqori darajada — bu jismoniy va ruhiy sog'liqqa to'g'ridan-to'g'ri ta'sir qiladi. Bugun kechqurun uning bilan yuzma-yuz, tinch muhitda suhbat qurib ko'ring — nima uni tashvishlantirayotganini bilib oling, lekin qoralamang. Har kuni 20–30 daqiqa ochiq havoda yurish, sport yoki musiqa bilan shug'ullanish stressni sezilarli kamaytiradi. Agar holat 2 haftadan ko'p davom etsa, mutaxassisga murojaat qilish zarur." },
      mid:  { icon: '🟡', title: "Stress o'rtacha — nazoratda ushlab turing", text: "Farzandingizda ma'lum stresslar bor, lekin hali boshqariladigan darajada. Uy muhitini tinch va issiq saqlang. Kechqurun oilaviy suhbat odatini shakllantiring — farzandingiz o'zini eshitilgan his qilsa, stress sezilarli kamayadi. Dam olish kun tartibiga e'tibor bering." },
      good: { icon: '🟢', title: "Stress past — sog'lom ruhiy holat", text: "Farzandingiz stressni yaxshi boshqaryapti. Bu muhim hayotiy ko'nikma. Shu sog'lom muhitni saqlash uchun oiladagi positiv muhit, ochiq muloqot va sifatli dam olishga e'tibor berishda davom eting." },
    },
  },
  ru: {
    focus: {
      bad:  { icon: '🔴', title: "Внимание очень низкое — нужны срочные меры", text: "Ваш ребёнок испытывает серьёзные трудности с концентрацией на уроках. Это часто связано с недосыпанием, чрезмерным использованием телефона или внутренней тревогой. Введите правило «цифрового детокса» за 10 минут до занятий — уберите телефоны и гаджеты в другую комнату. Проверьте режим сна: подросткам 13–17 лет необходимо не менее 8–9 часов. Резко ограничьте экранное время по вечерам." },
      mid:  { icon: '🟡', title: "Внимание среднее — есть куда расти", text: "Ваш ребёнок иногда хорошо концентрируется, иногда отвлекается. Попробуйте технику «Помодоро»: 25 минут глубокой работы + 5-минутный перерыв. Организуйте рабочее место — только нужные предметы на столе. Формируйте привычку учиться в одно и то же время каждый день: мозг адаптируется к рутине, и внимание обостряется само по себе." },
      good: { icon: '🟢', title: "Внимание хорошее — большое достижение", text: "Ваш ребёнок хорошо управляет вниманием. Чтобы сохранить этот результат, следите за балансом отдыха и активности. Обогатите знания интересными книгами или документальными фильмами — это укрепляет концентрацию и усиливает интерес к учёбе." },
    },
    motivation: {
      bad:  { icon: '🔴', title: "Мотивация очень низкая — срочно нужен разговор", text: "Ваш ребёнок потерял внутренний интерес к учёбе — это серьёзный сигнал. Сегодня вечером проведите искренний разговор без давления: спросите «Что трудно в учёбе? Что тебе нравится?» и внимательно выслушайте. Отсутствие цели — главная причина низкой мотивации. Вместе поставьте небольшую цель на 1 месяц и договоритесь о достойной награде. Никогда не упрекайте «почему не учишься?»." },
      mid:  { icon: '🟡', title: "Мотивация средняя — разожгите огонь", text: "У вашего ребёнка есть мотивация, но она непостоянна. Признавайте его достижения — иногда достаточно сказать «я видел, что ты сделал сегодня, это очень хорошо». Говорите о будущих профессиях, интересных судьбах успешных людей. Образ будущего — самый мощный мотиватор." },
      good: { icon: '🟢', title: "Мотивация высокая — поддержите её", text: "Ваш ребёнок с энтузиазмом относится к учёбе. Чтобы сохранить это состояние, регулярно отмечайте его достижения. Ставьте новые, чуть более сложные цели — пока человек растёт, мотивация не падает. Скажите ему, что видите эту силу в нём." },
    },
    consistency: {
      bad:  { icon: '🔴', title: "Регулярность очень низкая — режим дня нарушен", text: "Ваш ребёнок пропускает занятия или не выполняет задания систематически. Причина чаще всего в отсутствии чёткого распорядка дня. Составьте вместе простое расписание: пробуждение, еда, учёба, отдых — всё по времени. Первые 21 день — период формирования привычки — уделите особое внимание и поддержку." },
      mid:  { icon: '🟡', title: "Регулярность средняя — укрепляйте режим", text: "Ваш ребёнок работает хорошо одни дни и хуже в другие. Введите привычку совместного разбора недели — воскресным вечером 10 минут: что прошло хорошо, что нужно улучшить. Этот навык самоконтроля пригодится ему на всю жизнь." },
      good: { icon: '🟢', title: "Регулярность хорошая — основа успеха", text: "Регулярность — ключевое качество успешных людей. Ваш ребёнок осваивает его — это встречается редко. Чтобы ещё больше укрепить эту привычку, подарите ему дневник или приложение для отслеживания своего прогресса." },
    },
    confidence: {
      bad:  { icon: '🔴', title: "Уверенность очень низкая — нужна осторожность", text: "Ваш ребёнок может чувствовать себя неспособным. Это очень деликатная ситуация — неправильное отношение только усугубит её. Никогда не сравнивайте его с другими. Хвалите вслух даже маленькие успехи: «Это было очень сложно, но ты справился — я горжусь тобой». Если ситуация затянется, рассмотрите обращение к школьному психологу." },
      mid:  { icon: '🟡', title: "Уверенность средняя — время поддержать", text: "У вашего ребёнка есть уверенность в себе, но она ещё не окрепла. Давайте ответственные поручения — пусть помогает по дому, пусть его мнение учитывается в семейных решениях. Ощущение ответственности — самый эффективный способ укрепить самоуверенность." },
      good: { icon: '🟢', title: "Уверенность крепкая — отличная основа", text: "Ваш ребёнок верит в свои силы. Это делает его устойчивым и гибким перед трудностями. Чтобы ещё больше укрепить эту уверенность, поощряйте его пробовать новое: спорт, творчество, общественная деятельность — каждая новая сфера добавляет новую уверенность." },
    },
    stress: {
      bad:  { icon: '🔴', title: "Уровень стресса критический — действуйте немедленно", text: "У вашего ребёнка очень высокий уровень стресса — это напрямую влияет на физическое и психическое здоровье. Сегодня вечером поговорите с ним лично, в спокойной обстановке — узнайте, что его беспокоит, но не осуждайте. Ежедневные 20–30 минут прогулок на свежем воздухе, спорт или музыка заметно снижают стресс. Если состояние продолжается более 2 недель — необходима консультация специалиста." },
      mid:  { icon: '🟡', title: "Стресс средний — держите под контролем", text: "У вашего ребёнка есть определённые стрессы, но они пока управляемы. Поддерживайте дома тихую и тёплую атмосферу. Формируйте привычку семейного разговора по вечерам — когда ребёнок чувствует себя услышанным, стресс заметно снижается. Следите за режимом отдыха." },
      good: { icon: '🟢', title: "Стресс низкий — здоровое состояние", text: "Ваш ребёнок хорошо справляется со стрессом. Это важный жизненный навык. Чтобы сохранить эту здоровую среду, продолжайте уделять внимание позитивной атмосфере в семье, открытому общению и качественному отдыху." },
    },
  },
  en: {
    focus: {
      bad:  { icon: '🔴', title: "Attention very low — urgent action needed", text: "Your child is experiencing serious difficulty concentrating during lessons. This is often linked to lack of sleep, excessive phone use, or inner anxiety. Introduce a 10-minute 'digital detox' rule before studying — phones and devices in another room. Check sleep habits: teenagers aged 13–17 need at least 8–9 hours of sleep. Sharply limit screen time in the evening." },
      mid:  { icon: '🟡', title: "Attention is average — room to improve", text: "Your child sometimes focuses well, sometimes gets distracted. Try the Pomodoro technique: 25 minutes of deep work + 5-minute break. Keep the study space tidy — only necessary items on the desk. Build a habit of studying at the same time each day, since the brain adapts to routine and attention sharpens automatically." },
      good: { icon: '🟢', title: "Attention is good — a real achievement", text: "Your child manages their attention well. To maintain this, keep a healthy balance between rest and activity. Enrich their knowledge with interesting books or documentaries — this strengthens focus further and increases the joy of learning." },
    },
    motivation: {
      bad:  { icon: '🔴', title: "Motivation very low — urgent conversation needed", text: "Your child has lost their inner interest in learning — this is a serious signal. Tonight, have a sincere, pressure-free conversation: ask 'What's hard at school? What do you enjoy?' and listen carefully. Lack of goals is the main cause of low motivation — together set a small 1-month goal and agree on a meaningful reward. Never criticise with 'why aren't you studying?'" },
      mid:  { icon: '🟡', title: "Motivation average — spark the flame", text: "Your child has motivation, but it's inconsistent. Acknowledge their achievements — sometimes 'I saw what you did today, it was great' is enough. Talk about future careers and inspiring stories of successful people. A vision of the future is the most powerful motivator." },
      good: { icon: '🟢', title: "Motivation high — keep supporting it", text: "Your child is enthusiastic about learning. To keep this going, regularly celebrate their achievements. Set new, slightly more challenging goals — when a person keeps growing, motivation stays strong. Let them know you see this strength in them." },
    },
    consistency: {
      bad:  { icon: '🔴', title: "Consistency very low — daily routine is broken", text: "Your child is missing lessons or lacks consistency in completing tasks. The cause is usually the absence of a clear daily schedule. Together, draw up a simple timetable: fixed times for waking, meals, study, and rest. The first 21 days are the habit-forming period — give special attention and support during this time." },
      mid:  { icon: '🟡', title: "Consistency average — reinforce the routine", text: "Your child works well on some days and less so on others. Introduce a habit of reviewing the week together — Sunday evening, 10 minutes: what went well, what needs improving. This self-monitoring skill will serve them throughout life." },
      good: { icon: '🟢', title: "Consistency is good — the foundation of success", text: "Consistency is the defining trait of successful people. Your child is building this — it's rare to see. To reinforce it further, give them a journal or app to track their own progress." },
    },
    confidence: {
      bad:  { icon: '🔴', title: "Self-confidence very low — handle with care", text: "Your child may feel incapable. This is a very delicate situation — the wrong response can make things worse. Never compare them to others. Praise even small wins out loud: 'That was very hard, but you did it — I'm proud of you.' If this continues, consider reaching out to the school counsellor." },
      mid:  { icon: '🟡', title: "Self-confidence average — time to encourage", text: "Your child has some self-belief, but it hasn't fully developed yet. Give them responsible tasks — let them help at home, let their opinion count in family decisions. Feeling responsible is the most effective way to build confidence." },
      good: { icon: '🟢', title: "Self-confidence is strong — an excellent foundation", text: "Your child believes in their own abilities. This makes them resilient and adaptable when facing difficulties. To strengthen this further, encourage them to try new areas: sports, arts, community activities — every new field adds new confidence." },
    },
    stress: {
      bad:  { icon: '🔴', title: "Stress level critical — act now", text: "Your child's stress is very high — this directly affects both physical and mental health. Tonight, have a face-to-face, calm conversation — find out what is worrying them, without judgement. 20–30 minutes of walking outdoors, sport, or music every day significantly reduces stress. If the situation continues for more than 2 weeks, a professional consultation is necessary." },
      mid:  { icon: '🟡', title: "Stress average — keep it under control", text: "Your child has some stresses, but they are still manageable. Keep the home environment calm and warm. Build a habit of family conversations in the evenings — when your child feels heard, stress noticeably decreases. Pay attention to their rest schedule." },
      good: { icon: '🟢', title: "Stress low — healthy mental state", text: "Your child manages stress well. This is an important life skill. To maintain this healthy environment, keep nurturing a positive family atmosphere, open communication, and quality rest." },
    },
  },
}

const ADVICE_META_ALL: Record<Language, Record<string, { label: string; color: string; bg: string; border: string }>> = {
  uz: {
    focus:       { label: "E'tibor",     color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/20',       border: 'border-blue-100 dark:border-blue-900/30' },
    motivation:  { label: 'Motivatsiya', color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-950/20',   border: 'border-purple-100 dark:border-purple-900/30' },
    consistency: { label: 'Izchillik',   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
    confidence:  { label: 'Ishonch',     color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/20',     border: 'border-amber-100 dark:border-amber-900/30' },
    stress:      { label: 'Stress',      color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-950/20',       border: 'border-rose-100 dark:border-rose-900/30' },
  },
  ru: {
    focus:       { label: 'Внимание',    color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/20',       border: 'border-blue-100 dark:border-blue-900/30' },
    motivation:  { label: 'Мотивация',   color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-950/20',   border: 'border-purple-100 dark:border-purple-900/30' },
    consistency: { label: 'Регулярность',color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
    confidence:  { label: 'Уверенность', color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/20',     border: 'border-amber-100 dark:border-amber-900/30' },
    stress:      { label: 'Стресс',      color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-950/20',       border: 'border-rose-100 dark:border-rose-900/30' },
  },
  en: {
    focus:       { label: 'Focus',       color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/20',       border: 'border-blue-100 dark:border-blue-900/30' },
    motivation:  { label: 'Motivation',  color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-950/20',   border: 'border-purple-100 dark:border-purple-900/30' },
    consistency: { label: 'Consistency', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
    confidence:  { label: 'Confidence',  color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/20',     border: 'border-amber-100 dark:border-amber-900/30' },
    stress:      { label: 'Stress',      color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-950/20',       border: 'border-rose-100 dark:border-rose-900/30' },
  },
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-black w-7 text-right text-gray-600 dark:text-gray-300">{value}</span>
    </div>
  )
}

export default function ParentPsychologyPage() {
  const { t, lang } = useI18n()
  const ADVICE = ADVICE_ALL[lang] ?? ADVICE_ALL.uz
  const ADVICE_META = ADVICE_META_ALL[lang] ?? ADVICE_META_ALL.uz
  const [data, setData] = useState<PsychData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showAdvice, setShowAdvice] = useState(false)

  useEffect(() => {
    studentsApi.getMyChildPsychology()
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const getOverallLabel = (avg: number) =>
    avg >= 80 ? t('parent.overallExcellent')
    : avg >= 60 ? t('parent.overallGood')
    : avg >= 40 ? t('parent.overallAverage')
    : t('parent.overallLow')

  useSocketEvent<{ scores: PsychData['scores'] }>('scores:updated', (payload) => {
    if (!payload?.scores) return
    setData(prev => {
      if (!prev) return prev
      const s = payload.scores
      const avg = Math.round((s.focus + s.motivation + s.consistency + s.confidence) / 4)
      return { ...prev, scores: s, overall: { label: getOverallLabel(avg), avg } }
    })
  })

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
  const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

  if (loading) return (
    <DashboardLayout role="PARENT" title={t('parent.psychTitle')}>
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        <Skeleton className="h-44 rounded-[2.5rem]" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-[2.5rem]" />
          <Skeleton className="h-64 rounded-[2.5rem]" />
        </div>
        <Skeleton className="h-40 rounded-[2.5rem]" />
      </div>
    </DashboardLayout>
  )

  if (error || !data) return (
    <DashboardLayout role="PARENT" title={t('parent.psychTitle')}>
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <AlertCircle className="w-10 h-10 text-amber-400" />
        <p className="text-sm font-semibold text-gray-500">
          {t('parent.psychError')}
        </p>
      </div>
    </DashboardLayout>
  )

  const { scores, overall, trend } = data
  const hasRealScores = scores.focus !== 50 || scores.motivation !== 50 || scores.consistency !== 50

  return (
    <DashboardLayout role="PARENT" title={t('parent.psychTitle')}>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto pb-12 space-y-5">

        {/* Hero */}
        <motion.div variants={fadeUp} className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] p-6 overflow-hidden text-white shadow-xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/80">{t('parent.generalStatus')}</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-1">{getOverallLabel(overall.avg)}</h2>
              <p className="text-sm font-medium text-white/75">
                {data.student.lastName} {data.student.firstName} — {t('parent.psychSubtitle')}
              </p>
              {!hasRealScores && (
                <p className="mt-2 text-[11px] text-white/60 bg-white/10 rounded-xl px-3 py-1.5 inline-block">
                  {t('parent.psychPending')}
                </p>
              )}
            </div>

            <div className="flex gap-3 self-stretch sm:self-auto">
              <div className="flex-1 sm:flex-none bg-black/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 min-w-[6rem]">
                <Smile className="w-6 h-6 text-green-300 mx-auto mb-1" />
                <p className="text-2xl font-black mb-0.5">{overall.avg}%</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/60">{t('parent.average')}</p>
              </div>
              <div className="flex-1 sm:flex-none bg-black/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 min-w-[6rem]">
                <Target className="w-6 h-6 text-blue-300 mx-auto mb-1" />
                <p className="text-2xl font-black mb-0.5">{scores.focus}%</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/60">{t('parent.scoreFocus')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scores breakdown */}
        <motion.div variants={fadeUp} className="bg-white dark:bg-gray-900 rounded-[2rem] p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t('parent.indicatorsLabel')}</h3>
          <div className="space-y-4">
            {SCORE_META.map(meta => (
              <div key={meta.key}>
                <div className="flex justify-between mb-1">
                  <span className={cn('text-xs font-bold', meta.color)}>{t(meta.labelKey)}</span>
                </div>
                <ScoreBar
                  value={(scores as any)[meta.key]}
                  color={meta.bar}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trend Chart */}
        <motion.div variants={fadeUp} className="bg-white dark:bg-gray-900 rounded-[2rem] p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('parent.dynamicsLabel')}</h3>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{t('parent.scoreConsistency')}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />{t('parent.scoreStress')}</span>
            </div>
          </div>
          <div className="h-44 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gConsistency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-gray-800/60" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 700 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} tickCount={4} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: '1px solid #e5e7eb', background: 'white', fontSize: 12 }}
                  formatter={(val: number, name: string) => [`${Math.round(val)}%`, name === 'consistency' ? t('parent.scoreConsistency') : t('parent.scoreStress')]}
                  labelFormatter={(label) => `${label}`}
                />
                <Area type="monotone" dataKey="consistency" name="consistency" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#gConsistency)" dot={false} activeDot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="stress" name="stress" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#gStress)" dot={false} activeDot={{ r: 4, fill: '#F43F5E', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tavsiyalar */}
        <motion.div variants={fadeUp} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Header — tugma */}
          <button
            onClick={() => setShowAdvice(v => !v)}
            className="w-full flex items-center justify-between gap-3 p-5 text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-300/40">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-black text-gray-900 dark:text-white">{t('parent.adviceTitle')}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('parent.adviceSubtitle')}</p>
              </div>
            </div>
            <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform duration-300', showAdvice && 'rotate-180')} />
          </button>

          <AnimatePresence initial={false}>
            {showAdvice && (
              <motion.div
                key="advice"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                  {/* Umumiy holat banneri */}
                  <div className={cn(
                    'flex items-center gap-3 p-3.5 rounded-2xl',
                    overall.avg >= 65
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30'
                      : overall.avg >= 40
                      ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30'
                      : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30',
                  )}>
                    <ShieldCheck className={cn('w-5 h-5 shrink-0', overall.avg >= 65 ? 'text-emerald-500' : overall.avg >= 40 ? 'text-amber-500' : 'text-rose-500')} />
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {t('parent.generalStatus')}: <span className="font-black">{overall.label}</span> ({overall.avg}%)
                    </p>
                  </div>

                  {/* 5 ta ko'rsatkich bo'yicha maslahatlar */}
                  {(['focus', 'motivation', 'consistency', 'confidence', 'stress'] as const).map((key) => {
                    const invert = key === 'stress'
                    const level = getLevel((scores as any)[key], invert)
                    const advice = ADVICE[key][level]
                    const meta = ADVICE_META[key]
                    return (
                      <div key={key} className={cn('p-4 rounded-2xl border', meta.bg, meta.border)}>
                        <div className="flex items-start gap-3">
                          <span className="text-xl mt-0.5 shrink-0">{advice.icon}</span>
                          <div>
                            <p className={cn('text-[12px] font-black mb-1.5', meta.color)}>{advice.title}</p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{advice.text}</p>
                            <span className={cn('inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full', meta.bg, meta.color, 'border', meta.border)}>
                              {meta.label} · {(scores as any)[key]}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </motion.div>
    </DashboardLayout>
  )
}
