import { Therapist } from './therapist.types';
import { SessionStatus } from '@/lib/constants/enums';

export interface SessionUserSummary {
  _id: string;
  name: string;
  email: string;
}

export interface Session {
  _id: string;
  userId: string | SessionUserSummary;
  therapistId: string | Therapist;
  therapist?: Therapist;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  meetLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TherapistSlot {
  _id: string;
  therapistId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isCustomized: boolean;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDTO {
  therapistId: string;
  date: string;
  startTime: string;
}

export interface UpdateSessionDTO {
  status?: SessionStatus;
  date?: string;
  startTime?: string;
}
