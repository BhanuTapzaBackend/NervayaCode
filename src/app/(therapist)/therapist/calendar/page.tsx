'use client';

import { useTherapistDashboard } from '@/context/TherapistDashboardContext';
import { DashboardCalendar } from '@/components/Therapist/DashboardCalendar';

/**
 * The calendar on its own, full width.
 *
 * Same component as the dashboard's — one implementation, so the two can never
 * disagree about how a session is drawn. View and range live in the shared
 * context, so navigating here from the dashboard preserves both.
 */
export default function TherapistCalendarPage() {
  const { data, isLoading, rangeStart, view, setView, setRangeStart } = useTherapistDashboard();

  return (
    <DashboardCalendar
      sessions={data?.sessions ?? []}
      rangeStart={rangeStart}
      view={view}
      onViewChange={setView}
      onRangeStartChange={setRangeStart}
      isLoading={isLoading}
    />
  );
}
