import api from '@/lib/axios';
import type { ApiResponse } from '@/lib/api/types';
import type { Therapist } from '@/types/therapist.types';

export interface TherapistSession {
  _id: string;
  userId: string;
  therapistId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  meetLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TherapistCalendarEvent {
  id: string;
  title: string;
  /** ISO instant. */
  startAt: string;
  endAt: string;
  /** 'nervaya' came from a Nervaya booking; 'external' is the therapist's own entry. */
  origin: 'nervaya' | 'external';
  sessionId?: string;
  meetLink?: string;
  status?: string;
}

export interface TherapistCalendar {
  events: TherapistCalendarEvent[];
  /**
   * 'own'    — events live on the therapist's own @nervaya.com calendar.
   * 'shared' — they have no workspace mailbox, so events live on the shared
   *            Nervaya calendar and this is a filtered slice of it.
   */
  mode: 'own' | 'shared';
  calendarEmail: string;
  fromCache: boolean;
  syncedAt: string | null;
  warning?: string;
}

export interface TherapistSessionView {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetLink?: string;
  meetStatus?: string;
  /** Absolute instants — the client never re-parses wall-clock strings. */
  startAt: string;
  endAt: string;
  durationLabel: string;
  client: { _id: string; name: string } | null;
  isNewClient: boolean;
}

export interface TherapistDashboardData {
  counts: { upcomingToday: number; completedToday: number; pending: number; cancelledToday: number };
  sessions: TherapistSessionView[];
  upcoming: TherapistSessionView[];
  pendingRequests: TherapistSessionView[];
  recentCompleted: TherapistSessionView[];
}

export const therapistApi = {
  getMe: (): Promise<ApiResponse<Therapist>> => {
    return api.get('/therapist/me') as Promise<ApiResponse<Therapist>>;
  },

  getSessions: (status?: string): Promise<ApiResponse<TherapistSession[]>> => {
    const url = status ? `/therapist/sessions?status=${encodeURIComponent(status)}` : '/therapist/sessions';
    return api.get(url) as Promise<ApiResponse<TherapistSession[]>>;
  },

  /** Everything the dashboard renders, in one request. */
  getDashboard: (start: string, end: string): Promise<ApiResponse<TherapistDashboardData>> => {
    const query = new URLSearchParams({ start, end });
    return api.get(`/therapist/dashboard?${query.toString()}`) as Promise<ApiResponse<TherapistDashboardData>>;
  },

  /**
   * The therapist's calendar for a range. Reads our own DB first and only
   * consults Google when the cache is stale, so this is safe to call on render.
   * Pass `refresh` for an explicit user-triggered sync.
   */
  getCalendar: (start: string, end: string, refresh = false): Promise<ApiResponse<TherapistCalendar>> => {
    const query = new URLSearchParams({ start, end, ...(refresh ? { refresh: '1' } : {}) });
    return api.get(`/therapist/google/calendar?${query.toString()}`) as Promise<ApiResponse<TherapistCalendar>>;
  },
};
