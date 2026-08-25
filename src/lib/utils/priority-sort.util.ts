import type { PipelineStage } from 'mongoose';
import { UNPRIORITIZED } from '@/lib/constants/priority.constants';

/**
 * Aggregation stages that sort numbered items first (1 = top) and push every
 * un-numbered item to the bottom, newest-first among themselves.
 *
 * Why aggregation rather than `.find().sort({ priority: 1 })`: MongoDB ranks a
 * missing or null field among the LOWEST values ascending, so any document
 * saved before `priority` existed would sort ABOVE the numbered ones — the
 * exact opposite of the intended rule. `$ifNull` substitutes the sentinel at
 * query time, so the ordering is correct whether or not the backfill has run.
 *
 * `sortPriority` is stripped before the documents are returned.
 */
export function prioritySortStages(): PipelineStage[] {
  return [
    { $addFields: { sortPriority: { $ifNull: ['$priority', UNPRIORITIZED] } } },
    { $sort: { sortPriority: 1, createdAt: -1 } },
  ];
}

/** Removes the temporary sort key added by {@link prioritySortStages}. */
export function stripPrioritySortKey(): PipelineStage {
  return { $unset: 'sortPriority' };
}
