export type GroupStatus = 'ACTIVE' | 'ENDED' | 'NOT_STARTED'

const DAY_MAP: Record<string, string> = {
  monday: 'monday', tuesday: 'tuesday', wednesday: 'wednesday',
  thursday: 'thursday', friday: 'friday', saturday: 'saturday', sunday: 'sunday',
  dushanba: 'monday', seshanba: 'tuesday', chorshanba: 'wednesday',
  payshanba: 'thursday', juma: 'friday', shanba: 'saturday', yakshanba: 'sunday',
}

export function translateDay(day: string, t: (key: string) => string): string {
  const key = DAY_MAP[day.toLowerCase().trim()]
  return key ? t(`days.${key}`) : day
}

export function translateDayShort(day: string, t: (key: string) => string): string {
  return translateDay(day, t).slice(0, 3)
}

export interface GroupScheduleRow {
  day: string
  time: string
}

export function parseGroupSchedule(schedule: unknown): GroupScheduleRow[] {
  if (!schedule) return []

  if (Array.isArray(schedule)) {
    return schedule
      .map((item: any) => ({
        day: String(item?.day ?? ''),
        time: String(item?.time ?? ''),
      }))
      .filter((item) => item.day && item.time)
  }

  if (typeof schedule === 'string') {
    try {
      return parseGroupSchedule(JSON.parse(schedule))
    } catch {
      return []
    }
  }

  return []
}

export function getGroupStatus(group: any): GroupStatus {
  if (group?.status === 'ACTIVE' || group?.status === 'ENDED' || group?.status === 'NOT_STARTED') {
    return group.status
  }

  return group?.isActive ? 'ACTIVE' : 'ENDED'
}
