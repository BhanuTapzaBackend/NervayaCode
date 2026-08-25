import { configService } from '@/lib/services/config.service';
import Supplement from '@/lib/models/supplement.model';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import { ITEM_TYPE, type ItemType } from '@/lib/constants/enums';
import {
  SLEEP_BUNDLE_DISCOUNT_KEY,
  SLEEP_BUNDLE_DISCOUNT_MAX,
  SLEEP_BUNDLE_DISCOUNT_MIN,
  THERAPY_STARTING_PRICE_KEY,
  DEEP_REST_RECOMMENDATION_PRICE_KEY,
  SUPPLEMENT_RECOMMENDATION_PRICE_KEY,
} from '@/lib/constants/sleepPlan.constants';
import { DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';

export type ServiceKey = 'SUPPLEMENT' | 'THERAPY' | 'GUIDED_AUDIO';

export const SERVICE_KEYS: readonly ServiceKey[] = ['SUPPLEMENT', 'THERAPY', 'GUIDED_AUDIO'] as const;

export interface PlanLine {
  service: ServiceKey;
  itemType: ItemType;
  name: string;
  unitPrice: number;
  image: string;
  /** Supplement id, therapist id, or the Deep Rest sentinel — filled by the caller for THERAPY. */
  itemId?: string;
}

export interface PlanPricing {
  lines: PlanLine[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
}

/** Config values are stored loosely; only a finite positive number is a usable price. */
function readPrice(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readDiscount(value: unknown): number | null {
  // Guard the empty cases explicitly: Number(null) and Number('') are both 0,
  // so without this an unset discount key reads as a valid 0% and "pricing not
  // configured" becomes indistinguishable from "no discount".
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n >= SLEEP_BUNDLE_DISCOUNT_MIN && n <= SLEEP_BUNDLE_DISCOUNT_MAX ? n : null;
}

/** Narrows arbitrary input to the three known services, preserving order and dropping duplicates. */
export function parseServices(input: unknown): ServiceKey[] {
  const raw = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',') : [];
  const seen = new Set<ServiceKey>();
  for (const entry of raw) {
    const key = String(entry).trim().toUpperCase() as ServiceKey;
    if (SERVICE_KEYS.includes(key)) seen.add(key);
  }
  return SERVICE_KEYS.filter((key) => seen.has(key));
}

/**
 * The single source of truth for what a sleep plan costs.
 *
 * Both the quote shown on the recommendation and the order actually charged go
 * through this, so the two cannot drift. Prices come from admin config — never
 * from the client, and for therapy never from `therapist.sessionFee`, which
 * governs direct Therapy Corner bookings instead.
 *
 * Throws when pricing is unconfigured rather than silently charging zero.
 */
export async function resolvePlanPricing(services: ServiceKey[]): Promise<PlanPricing> {
  await connectDB();

  if (services.length === 0) {
    throw new ValidationError('Select at least one service for your plan');
  }

  const [supplementPrice, deepRestPrice, therapyPrice, discountPct] = await Promise.all([
    configService.get(SUPPLEMENT_RECOMMENDATION_PRICE_KEY).then(readPrice),
    configService.get(DEEP_REST_RECOMMENDATION_PRICE_KEY).then(readPrice),
    configService.get(THERAPY_STARTING_PRICE_KEY).then(readPrice),
    configService.get(SLEEP_BUNDLE_DISCOUNT_KEY).then(readDiscount),
  ]);

  if (discountPct === null) {
    throw new ValidationError('Sleep plan pricing is not configured');
  }

  const lines: PlanLine[] = [];

  for (const service of services) {
    if (service === 'SUPPLEMENT') {
      if (supplementPrice === null) throw new ValidationError('Sleep plan pricing is not configured');
      // The plan sells whichever supplement is active, at the configured plan
      // price rather than the supplement's own listed price.
      const supplement = await Supplement.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
      if (!supplement) throw new ValidationError('No active supplement available for the plan');
      lines.push({
        service,
        itemType: ITEM_TYPE.SUPPLEMENT,
        itemId: String(supplement._id),
        name: supplement.name,
        unitPrice: supplementPrice,
        image: supplement.image ?? '',
      });
    } else if (service === 'GUIDED_AUDIO') {
      if (deepRestPrice === null) throw new ValidationError('Sleep plan pricing is not configured');
      lines.push({
        service,
        itemType: ITEM_TYPE.DRIFT_OFF,
        itemId: 'drift-off-session',
        name: 'Deep Rest Session',
        unitPrice: deepRestPrice,
        image: DRIFT_OFF_SESSION_IMAGE,
      });
    } else {
      if (therapyPrice === null) throw new ValidationError('Sleep plan pricing is not configured');
      // itemId (the therapist) is supplied at checkout, once one is chosen.
      lines.push({
        service,
        itemType: ITEM_TYPE.THERAPY,
        name: 'Therapy Session',
        unitPrice: therapyPrice,
        image: '',
      });
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice, 0);
  // Round the discount, not the total, so the discount shown on the invoice is
  // exactly the difference between subtotal and total.
  const discountAmount = Math.round((subtotal * discountPct) / 100);

  return {
    lines,
    subtotal,
    discountPct,
    discountAmount,
    total: subtotal - discountAmount,
  };
}
