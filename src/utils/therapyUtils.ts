import { GENDER_OPTIONS } from '@/lib/constants/enums';

export function parseTime12Hour(timeValue: string): { hours: number; minutes: number } | null {
  const match = timeValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const hour = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (Number.isNaN(hour) || Number.isNaN(minutes) || hour > 12 || minutes > 59) {
    return null;
  }

  let hours24 = hour % 12;
  if (period === 'PM') {
    hours24 += 12;
  }

  return { hours: hours24, minutes };
}

export function getSlotDateTime(dateValue: string, startTime: string): Date | null {
  const [year, month, day] = dateValue.split('-').map(Number);
  const parsedTime = parseTime12Hour(startTime);

  if (!year || !month || !day || !parsedTime) {
    return null;
  }

  const dateTime = new Date(year, month - 1, day, parsedTime.hours, parsedTime.minutes, 0, 0);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextAvailableSlotDateTime(
  schedules: { slots: { startTime: string; isAvailable: boolean }[]; date: string }[],
  now: Date,
): Date | null {
  const slots = schedules
    .flatMap((schedule) =>
      schedule.slots.map((slot) => ({
        dateTime: getSlotDateTime(schedule.date, slot.startTime),
        isAvailable: slot.isAvailable,
      })),
    )
    .filter(
      (slot): slot is { dateTime: Date; isAvailable: boolean } =>
        slot.isAvailable && slot.dateTime !== null && slot.dateTime.getTime() > now.getTime(),
    )
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  return slots[0]?.dateTime ?? null;
}

export function formatNextSlot(dateTime: Date): string {
  const datePart = dateTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
  const timePart = dateTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} ${timePart}`;
}

export function formatExperienceYears(experience?: string): string {
  if (!experience || !experience.trim()) return '—';
  const normalized = experience.trim();
  const numericMatch = normalized.match(/\d+/);
  if (numericMatch?.[0]) {
    return `${numericMatch[0]}+ years`;
  }
  if (/year/i.test(normalized)) return normalized;
  return normalized;
}

export function formatGender(value: string): string {
  if (!value) return '';
  const option = GENDER_OPTIONS.find((opt) => opt.value === value.toLowerCase());
  if (option) return option.label;

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
