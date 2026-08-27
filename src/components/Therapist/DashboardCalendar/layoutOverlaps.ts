import type { TherapistSessionView } from '@/lib/api/therapistApi';
import { istEndMinutes, istMinutesOfDay } from '@/utils/therapistDate';

export interface PositionedSession {
  session: TherapistSessionView;
  /** Percentage offsets within the day column. */
  leftPct: number;
  widthPct: number;
}

/**
 * Lays overlapping sessions out side by side.
 *
 * Absolute positioning on `top`/`height` alone stacks concurrent events exactly
 * on top of each other, so the one underneath is invisible and unclickable —
 * which is precisely the case a therapist most needs to see, because it means
 * they are double-booked.
 *
 * Standard sweep: group into clusters of mutually overlapping events, then give
 * each event the leftmost column whose previous occupant has already ended.
 */
export function layoutOverlaps(sessions: TherapistSessionView[]): PositionedSession[] {
  if (sessions.length === 0) return [];

  // Bounds computed ONCE per session rather than inside the comparator, which
  // called them 2x per comparison.
  const bounds = sessions.map((session) => ({
    session,
    start: istMinutesOfDay(session.startAt),
    end: istEndMinutes(session.startAt, session.endAt),
  }));
  const sorted = bounds.sort((a, b) => a.start - b.start);

  const positioned: PositionedSession[] = [];
  let cluster: typeof sorted = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (!cluster.length) return;

    // Column ends, indexed by column number.
    const columnEnds: number[] = [];
    const assignments = cluster.map(({ session, start, end }) => {
      let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
      if (column === -1) {
        column = columnEnds.length;
      }
      columnEnds[column] = end;
      return { session, column };
    });

    const columnCount = columnEnds.length;
    for (const { session, column } of assignments) {
      positioned.push({
        session,
        leftPct: (column / columnCount) * 100,
        widthPct: 100 / columnCount,
      });
    }

    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const entry of sorted) {
    if (cluster.length && entry.start >= clusterEnd) flush();

    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, entry.end);
  }
  flush();

  return positioned;
}
