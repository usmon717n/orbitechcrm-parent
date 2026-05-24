import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

export function getMonthName(month: number): string {
  return MONTHS[month - 1] || '';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function getXpProgress(xp: number): { current: number; needed: number; percent: number } {
  const xpPerLevel = 300;
  const currentLevel = Math.floor(xp / xpPerLevel) + 1;
  // Keyingi bosqichga kerakli umumiy XP (920 / 1200 kabi)
  const needed = currentLevel * xpPerLevel;
  const current = xp;
  const percent = Math.min(100, Math.floor((xp / needed) * 100));
  return { current, needed, percent };
}

export function getLevelFromXp(xp: number): number {
  return Math.floor(xp / 300) + 1;
}

export function getAttendanceColor(status: string): string {
  switch (status) {
    case 'PRESENT': return 'text-green-600 bg-green-100';
    case 'ABSENT':  return 'text-red-600 bg-red-100';
    case 'LATE':    return 'text-yellow-600 bg-yellow-100';
    default:        return 'text-gray-600 bg-gray-100';
  }
}

export function getAttendanceLabel(status: string): string {
  switch (status) {
    case 'PRESENT': return 'Keldi';
    case 'ABSENT':  return 'Kelmadi';
    case 'LATE':    return 'Kech keldi';
    default:        return status;
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'PAID':    return 'text-green-700 bg-green-100';
    case 'UNPAID':  return 'text-red-700 bg-red-100';
    case 'PARTIAL': return 'text-yellow-700 bg-yellow-100';
    default:        return 'text-gray-700 bg-gray-100';
  }
}

export function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case 'PAID':    return "To'langan";
    case 'UNPAID':  return "To'lanmagan";
    case 'PARTIAL': return 'Qisman';
    default:        return status;
  }
}

const MONTHS_SHORT = ['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek']

export function uzShort(date: string | Date): string {
  const d = new Date(date)
  return `${d.getDate()}-${MONTHS_SHORT[d.getMonth()]}`
}

export function uzShortYear(date: string | Date): string {
  const d = new Date(date)
  return `${d.getDate()}-${MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()}`
}

export function uzMonthYear(date: string | Date): string {
  const d = new Date(date)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function uzShortTime(date: string | Date): string {
  const d = new Date(date)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()}-${MONTHS_SHORT[d.getMonth()]}, ${h}:${m}`
}
