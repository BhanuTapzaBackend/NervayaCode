/** The therapist + slot chosen for the sleep-plan bundle. */
export interface TherapistSelection {
  therapistId: string;
  therapistName: string;
  therapistImage?: string;
  sessionFee: number;
  /** ISO date key, e.g. "2026-09-10". */
  date: string;
  /** 12-hour start time as stored on the slot, e.g. "10:00 AM". */
  slot: string;
}
