import connectDB from '@/lib/db/mongodb';
import Order, { type IShippingAddress } from '@/lib/models/order.model';
import Therapist from '@/lib/models/therapist.model';
import { ValidationError } from '@/lib/utils/error.util';
import { ITEM_TYPE, PAYMENT_STATUS, ORDER_STATUS } from '@/lib/constants/enums';
import { SLEEP_PLAN_BUNDLE_SOURCE } from '@/lib/constants/sleepPlan.constants';
import { resolvePlanPricing, type ServiceKey } from '@/lib/services/sleep-plan.service';
import { holdSlot, isHeldByAnother } from '@/lib/services/slot-hold.service';
import { isSlotInPast } from '@/lib/utils/sessionDateTime.util';
import { toObjectId } from '@/lib/utils/objectId.util';

export interface PlanCheckoutInput {
  services: ServiceKey[];
  /** Required when the plan includes THERAPY. */
  therapy?: { therapistId: string; date: string; slot: string };
  shippingAddress?: IShippingAddress;
}

/**
 * Creates the pending Order for a sleep plan.
 *
 * The client sends intent only — which services, which therapist, which slot.
 * Every amount is resolved here from admin config via resolvePlanPricing, so a
 * tampered request cannot change what is charged, and the quote the customer
 * saw cannot drift from the order.
 *
 * The therapy line is an ordinary order item carrying the therapist as `itemId`
 * and the slot in `metadata`; payment.service already turns exactly that into a
 * Session inside the payment transaction.
 */
export async function createSleepPlanOrder(userId: string, input: PlanCheckoutInput) {
  await connectDB();

  const pricing = await resolvePlanPricing(input.services);
  const needsTherapy = input.services.includes('THERAPY');

  if (needsTherapy) {
    const therapy = input.therapy;
    if (!therapy?.therapistId || !therapy.date || !therapy.slot) {
      throw new ValidationError('Choose a therapist and time slot for your plan');
    }
    if (isSlotInPast(therapy.date, therapy.slot)) {
      throw new ValidationError('This time slot has already passed. Please choose a later slot.');
    }

    const therapist = await Therapist.findById(therapy.therapistId).lean();
    if (!therapist) throw new ValidationError('Therapist not found');
    if (!therapist.isAvailable) throw new ValidationError('Therapist is not available');

    if (await isHeldByAnother(userId, { ...therapy, startTime: therapy.slot })) {
      throw new ValidationError('That time slot has just been taken. Please choose another.');
    }
    // Reserve before the order exists: from here until payment lands, no other
    // checkout can claim this slot.
    await holdSlot(userId, { therapistId: therapy.therapistId, date: therapy.date, startTime: therapy.slot });

    const line = pricing.lines.find((l) => l.service === 'THERAPY');
    if (line) {
      line.itemId = String(therapist._id);
      line.name = `Therapy Session with ${therapist.name}`;
      line.image = therapist.image ?? '';
    }
  }

  const items = pricing.lines.map((line) => ({
    itemType: line.itemType,
    itemId: line.itemType === ITEM_TYPE.THERAPY ? toObjectId(line.itemId as string) : line.itemId,
    name: line.name,
    quantity: 1,
    price: line.unitPrice,
    image: line.image,
    metadata:
      line.itemType === ITEM_TYPE.THERAPY && input.therapy
        ? { date: input.therapy.date, slot: input.therapy.slot, source: SLEEP_PLAN_BUNDLE_SOURCE }
        : { source: SLEEP_PLAN_BUNDLE_SOURCE },
  }));

  const order = await Order.create({
    userId: toObjectId(userId),
    items,
    // The bundle discount rides on promoDiscount, so the existing invoice and
    // order-summary totals render it with no further change.
    promoCode: SLEEP_PLAN_BUNDLE_SOURCE,
    promoDiscount: pricing.discountAmount,
    totalAmount: pricing.total,
    paymentStatus: PAYMENT_STATUS.PENDING,
    orderStatus: ORDER_STATUS.PENDING,
    ...(input.shippingAddress && { shippingAddress: input.shippingAddress }),
  });

  return { order, pricing };
}
