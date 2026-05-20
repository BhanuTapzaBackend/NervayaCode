export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDateDisabled(date: Date, minDate?: Date, maxDate?: Date, fullyBookedDates?: Set<string>): boolean {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  if (minDate) {
    const minOnly = new Date(minDate);
    minOnly.setHours(0, 0, 0, 0);
    if (dateOnly < minOnly) return true;
  }
  if (maxDate) {
    const maxOnly = new Date(maxDate);
    maxOnly.setHours(0, 0, 0, 0);
    if (dateOnly > maxOnly) return true;
  }
  if (fullyBookedDates?.has(toDateString(dateOnly))) return true;
  return false;
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}
