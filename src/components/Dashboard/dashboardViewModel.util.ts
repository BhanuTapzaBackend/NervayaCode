import type { Session } from '@/types/session.types';
import type { Order } from '@/types/supplement.types';
import type { ISleepAssessmentResponse, SleepAssessmentSeverityBand } from '@/types/sleepAssessment.types';
import { SESSION_STATUS } from '@/lib/constants/enums';
import { formatTimeAgo } from '@/lib/utils/timeAgo.util';
import { parseSessionStartDateTime } from '@/lib/utils/sessionDateTime.util';
import { SEVERITY_BANNER_MAP } from './AssessmentTile/severityBanner';

export interface SessionCounts {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface NextSessionInfo {
  session: Session;
  dateTime: Date;
}

export interface AssessmentTileModel {
  status: 'not_started' | 'in_progress' | 'completed';
  value: string;
  subtitle: string;
  ctaLabel: string;
  description?: string;
  bannerText?: string;
  lastAssessed?: string;
  severityBand?: SleepAssessmentSeverityBand;
  /** When true, do not show the CTA. */
  hideCta?: boolean;
}

export type ActivityIconKey = 'session' | 'order' | 'assessment';

export interface ActivityModelItem {
  id: string;
  label: string;
  timeLabel: string;
  iconKey: ActivityIconKey;
  time: Date;
}

export function getSessionCounts(sessions: Session[]): SessionCounts {
  const counts: SessionCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  for (const s of sessions) {
    const key = (s.status || '').toLowerCase() as keyof SessionCounts;
    if (key in counts) counts[key] += 1;
  }
  return counts;
}

export function getNextSessionInfo(sessions: Session[], nowMs: number = Date.now()): NextSessionInfo | null {
  const upcoming: NextSessionInfo[] = [];
  for (const s of sessions) {
    if (s.status === SESSION_STATUS.CANCELLED) continue;
    const startDateTime = parseSessionStartDateTime(s.date, s.startTime);
    const endDateTime = parseSessionStartDateTime(s.date, s.endTime);
    if (!startDateTime || !endDateTime) continue;
    if (endDateTime.getTime() <= nowMs) continue;
    upcoming.push({ session: s, dateTime: startDateTime });
  }
  upcoming.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  return upcoming[0] ?? null;
}

export function getAssessmentTileModel(
  latestAssessment: ISleepAssessmentResponse | null,
  inProgressAssessment: ISleepAssessmentResponse | null,
): AssessmentTileModel {
  const inProgress = inProgressAssessment && inProgressAssessment.completedAt == null ? inProgressAssessment : null;
  if (inProgress) {
    const updatedAt = inProgress.updatedAt;
    return {
      status: 'in_progress',
      value: 'In progress',
      subtitle: updatedAt ? `Last updated ${formatTimeAgo(updatedAt)}` : 'Continue where you left off.',
      ctaLabel: 'Continue assessment',
    };
  }

  const completedAt = latestAssessment?.completedAt;
  const result = latestAssessment?.result;
  if (latestAssessment && completedAt && result) {
    const bandEntry = SEVERITY_BANNER_MAP[result.severityBand];
    return {
      status: 'completed',
      value: bandEntry.headline,
      subtitle: 'Based on your latest inputs',
      description: result.description,
      bannerText: bandEntry.fallbackText,
      severityBand: result.severityBand,
      lastAssessed: formatTimeAgo(completedAt),
      ctaLabel: 'View Your Personalized Sleep Plan',
    };
  }

  return {
    status: 'not_started',
    value: 'Not started',
    subtitle: 'Take a quick assessment to personalize your journey.',
    ctaLabel: 'Start assessment',
  };
}

export function buildRecentActivity(
  sessions: Session[],
  orders: Order[],
  latestAssessment: ISleepAssessmentResponse | null,
  limit: number = 5,
): ActivityModelItem[] {
  const items: ActivityModelItem[] = [];

  for (const s of sessions) {
    const when = new Date(s.createdAt || s.updatedAt || Date.now());
    const th = s.therapistId;
    const therapistName = typeof th === 'object' && th && 'name' in th ? (th as { name: string }).name : 'therapist';
    const status = (s.status || '').toLowerCase();
    const label =
      status === 'cancelled'
        ? `Cancelled therapy session with ${therapistName}`
        : status === 'completed'
          ? `Completed therapy session with ${therapistName}`
          : `Booked therapy session with ${therapistName}`;

    items.push({
      id: `session-${s._id}`,
      label,
      time: when,
      timeLabel: formatTimeAgo(when),
      iconKey: 'session',
    });
  }

  for (const o of orders) {
    const when = new Date(o.createdAt ?? Date.now());
    const label = `Order ${o.orderStatus} • ₹${Math.round(o.totalAmount)}`;
    items.push({
      id: `order-${o._id}`,
      label,
      time: when,
      timeLabel: formatTimeAgo(when),
      iconKey: 'order',
    });
  }

  const completedAt = latestAssessment?.completedAt;
  if (latestAssessment && completedAt) {
    const when = new Date(completedAt);
    if (!Number.isNaN(when.getTime())) {
      items.push({
        id: `assessment-${latestAssessment._id}`,
        label: 'Completed sleep assessment',
        time: when,
        timeLabel: formatTimeAgo(when),
        iconKey: 'assessment',
      });
    }
  }

  items.sort((a, b) => b.time.getTime() - a.time.getTime());
  return items.slice(0, limit);
}
