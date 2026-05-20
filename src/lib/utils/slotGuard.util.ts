import { timeToMinutes } from './scheduleTime.util';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Returns true if the slot is more than 48 hours from now,
 * meaning it CAN be modified. Returns false if within 48 hours.
 */
export function canModifyBookedSlot(date: string, startTime: string): boolean {
  const [year, month, day] = date.split('-').map(Number);
  const totalMinutes = timeToMinutes(startTime);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const slotDate = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();

  return slotDate.getTime() - now.getTime() > FORTY_EIGHT_HOURS_MS;
}
