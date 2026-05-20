export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function timeToMinutes(time12: string): number {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${String(min).padStart(2, '0')} ${period}`;
}

export function generateTimeSlotsBetween(startTime: string, endTime: string, slotDuration = 60): string[] {
  const slots: string[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const lunchStart = timeToMinutes('12:00 PM');
  const lunchEnd = timeToMinutes('02:00 PM');
  let minutes = startMinutes;
  while (minutes < endMinutes) {
    const slotEnd = minutes + slotDuration;
    if (slotEnd <= lunchStart) {
      slots.push(minutesToTime(minutes));
      minutes += slotDuration;
    } else if (minutes >= lunchEnd) {
      slots.push(minutesToTime(minutes));
      minutes += slotDuration;
    } else {
      minutes = lunchEnd;
    }
  }
  return slots;
}
