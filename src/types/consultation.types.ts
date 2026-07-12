/** A bare start/end pair in display format, e.g. { startTime: '9:00 AM', endTime: '9:30 AM' }. */
export interface SlotTime {
  startTime: string;
  endTime: string;
}

/** A slot as stored on a schedule document. */
export interface IConsultationSlot extends SlotTime {
  /** Admin can close a slot without deleting it. */
  isAvailable: boolean;
  /** Non-null means booked. Holds the ConsultationLead _id. */
  leadId: string | null;
}

/** A slot as exposed to the public booking form. Never leaks leadId. */
export interface PublicSlot extends SlotTime {
  isAvailable: boolean;
}

export interface GenerateRangeParams {
  /** YYYY-MM-DD */
  fromDate: string;
  /** YYYY-MM-DD */
  toDate: string;
  /** 24-hour HH:MM, from <input type="time"> */
  startTime: string;
  /** 24-hour HH:MM */
  endTime: string;
  slotMinutes: number;
  /** 0=Sunday .. 6=Saturday */
  weekdays: number[];
}

export interface GenerateRangeResult {
  datesGenerated: number;
  slotsCreated: number;
  bookingsPreserved: number;
}

export interface ConsultationLead {
  _id: string;
  firstName: string;
  lastName: string;
  connectionType: 'Video Call' | 'Phone Call';
  email?: string;
  mobile?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  meetLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationScheduleDay {
  _id: string;
  date: string;
  slots: IConsultationSlot[];
}

export interface ConsultationFiltersParams {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}
