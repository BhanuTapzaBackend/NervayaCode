import Order, { IOrder, IOrderItem } from '@/lib/models/order.model';
import Cart from '@/lib/models/cart.model';
import Supplement from '@/lib/models/supplement.model';
import Therapist from '@/lib/models/therapist.model';
// Imported for its side-effect of registering the schema: getAllOrders populates `userId`.
import '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';
import Session from '@/lib/models/session.model';
import {
  PAYMENT_STATUS,
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  OrderStatus,
  ITEM_TYPE,
  type ItemType,
} from '@/lib/constants/enums';
import { getShippingCost } from '@/utils/shipping.util';
import { DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';
import { toObjectId } from '@/lib/utils/objectId.util';
import { isHeldByAnother } from '@/lib/services/slot-hold.service';
import { supplementImage } from '@/utils/supplement.util';

export interface CreateOrderParams {
  shippingAddress?: IOrder['shippingAddress'];
  promoCode?: string;
  promoDiscount?: number;
}

export async function createOrder(userId: string, params: CreateOrderParams) {
  await connectDB();

  const { shippingAddress, promoCode, promoDiscount = 0 } = params;
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('Invalid User ID');
  }

  const userObjectId = toObjectId(userId);
  const cart = await Cart.findOne({ userId: userObjectId });
  if (!cart || cart.items.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  const orderItems: IOrderItem[] = [];
  for (const cartItem of cart.items) {
    if (cartItem.itemType === ITEM_TYPE.SUPPLEMENT) {
      const supplement = await Supplement.findById(cartItem.itemId);
      if (!supplement) {
        throw new ValidationError(`Supplement ${cartItem.itemId} not found`);
      }

      if (!supplement.isActive) {
        throw new ValidationError(`Supplement ${supplement.name} is not available`);
      }

      // TODO: Race condition — stock check is not atomic. Use $inc with $gte guard at payment confirmation time.
      if (supplement.stock < cartItem.quantity) {
        throw new ValidationError(`Insufficient stock for ${supplement.name}`);
      }

      orderItems.push({
        itemType: ITEM_TYPE.SUPPLEMENT,
        itemId: supplement._id,
        name: supplement.name,
        quantity: cartItem.quantity,
        price: supplement.price,
        image: supplementImage(supplement),
      });
    } else {
      if (cartItem.itemType === ITEM_TYPE.THERAPY) {
        if (!Types.ObjectId.isValid(cartItem.itemId)) {
          throw new ValidationError('Invalid Therapist ID');
        }
        const therapist = await Therapist.findById(cartItem.itemId);
        if (!therapist) {
          throw new ValidationError('Therapist not found');
        }
        if (!therapist.isAvailable) {
          throw new ValidationError('Therapist is not available');
        }

        const { date, slot } = cartItem.metadata || {};
        if (date && slot) {
          const existingSession = await Session.findOne({
            therapistId: therapist._id,
            date,
            startTime: slot,
            status: { $ne: 'cancelled' },
          });
          if (existingSession) {
            throw new ValidationError(
              'One or more therapy slots in your cart have already been booked. Please update your cart.',
            );
          }
        }
      }
      orderItems.push({
        itemType: cartItem.itemType,
        itemId: cartItem.itemId,
        name: cartItem.name || 'Digital Session',
        quantity: cartItem.quantity,
        price: cartItem.price,
        image: cartItem.image || '',
        metadata: cartItem.metadata,
      });
    }
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isDigitalOnly = cart.items.every(
    (item) => item.itemType === ITEM_TYPE.DRIFT_OFF || item.itemType === ITEM_TYPE.THERAPY,
  );
  const shipping = isDigitalOnly ? 0 : getShippingCost(subtotal);
  const totalAmount = Math.max(0, subtotal + shipping - promoDiscount);

  const order = await Order.create({
    userId: userObjectId,
    items: orderItems,
    totalAmount,
    paymentStatus: PAYMENT_STATUS.PENDING,
    orderStatus: ORDER_STATUS.PENDING,
    shippingAddress,
    ...(promoCode && { promoCode, promoDiscount }),
  });

  // Promo usage is incremented in payment.service.ts AFTER successful payment verification
  // to ensure items stay in cart if payment is cancelled or fails.

  return await Order.findById(order._id);
}

export interface DirectOrderParams {
  itemId: string;
  itemType: string; // Using string to bypass strict enums, but validated internally
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  metadata?: Record<string, unknown>;
}

export async function createDirectOrder(userId: string, params: DirectOrderParams) {
  await connectDB();

  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('Invalid User ID');
  }
  if (params.quantity < 1) {
    throw new ValidationError('Quantity must be at least 1');
  }

  let finalPrice = params.price || 0;
  let finalName = params.name || '';
  let resolvedImage = params.image || '';

  if (params.itemType === ITEM_TYPE.SUPPLEMENT) {
    if (!Types.ObjectId.isValid(params.itemId)) throw new ValidationError('Invalid Supplement ID');
    const supplement = await Supplement.findById(params.itemId);
    if (!supplement) throw new ValidationError('Supplement not found');
    if (!supplement.isActive) throw new ValidationError('Supplement is not available');
    // TODO: Race condition — stock check is not atomic. Use $inc with $gte guard at payment confirmation time.
    if (supplement.stock < params.quantity) throw new ValidationError('Insufficient stock');

    finalPrice = supplement.price;
    finalName = supplement.name;
    resolvedImage = supplementImage(supplement);
  } else if (params.itemType === ITEM_TYPE.DRIFT_OFF) {
    if (!finalPrice || finalPrice <= 0) throw new ValidationError('Price is required for Deep Rest items');
    if (!finalName) finalName = 'Deep Rest Session';
    resolvedImage = DRIFT_OFF_SESSION_IMAGE;
  } else if (params.itemType === ITEM_TYPE.THERAPY) {
    if (!Types.ObjectId.isValid(params.itemId)) throw new ValidationError('Invalid Therapist ID');
    const therapist = await Therapist.findById(params.itemId);
    if (!therapist) throw new ValidationError('Therapist not found');
    if (!therapist.isAvailable) throw new ValidationError('Therapist is not available');

    const { date, slot } = params.metadata || {};
    if (date && slot) {
      const existingSession = await Session.findOne({
        therapistId: therapist._id,
        date,
        startTime: slot,
        status: { $ne: 'cancelled' },
      });
      if (existingSession) {
        throw new ValidationError('Slot is already booked');
      }
      // A sleep-plan checkout may be mid-payment for this slot with no Session
      // yet, so the query above would miss it.
      if (
        await isHeldByAnother(userId, {
          therapistId: String(therapist._id),
          date: String(date),
          startTime: String(slot),
        })
      ) {
        throw new ValidationError('That time slot has just been taken. Please choose another.');
      }
    }

    finalPrice = therapist.sessionFee || 0;
    finalName = `Therapy Session with ${therapist.name}`;
    resolvedImage = therapist.image || '';
  }

  const isObjectId = params.itemType === ITEM_TYPE.SUPPLEMENT || params.itemType === ITEM_TYPE.THERAPY;

  const orderItem: IOrderItem = {
    itemType: params.itemType as ItemType,
    itemId: isObjectId ? new Types.ObjectId(params.itemId) : params.itemId,
    name: finalName,
    quantity: params.quantity,
    price: finalPrice,
    image: resolvedImage,
    metadata: params.metadata,
  };

  const totalAmount = finalPrice * params.quantity;

  const order = await Order.create({
    userId: toObjectId(userId),
    items: [orderItem],
    totalAmount,
    paymentStatus: PAYMENT_STATUS.PENDING,
    orderStatus: ORDER_STATUS.PENDING,
    shippingAddress: undefined,
  });

  return await Order.findById(order._id);
}

/**
 * `OrderItem.itemId` is Mixed, so a supplement item can hold a non-ObjectId
 * (seed/legacy rows carry values like "seed-item"). Feeding those to a query
 * throws a CastError, so only real ids may reach the `$in`.
 */
function isObjectIdString(value: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

/**
 * Order items snapshot the product image at purchase time, but supplements moved
 * their artwork into `images` and left the legacy `image` empty, so every stored
 * supplement item has `image: ''`. Backfill those from the product at read time
 * so all order views (admin, My Orders, receipts) show a thumbnail.
 */
async function withResolvedItemImages<T extends { items: IOrderItem[] }>(orders: T[]): Promise<T[]> {
  const missingIds = new Set(
    orders.flatMap((order) =>
      order.items
        .filter((item) => item.itemType === ITEM_TYPE.SUPPLEMENT && !item.image)
        .map((item) => String(item.itemId))
        .filter(isObjectIdString),
    ),
  );
  if (missingIds.size === 0) return orders;

  const supplements = await Supplement.find({ _id: { $in: [...missingIds] } })
    .select('image images')
    .lean();
  const imageById = new Map(supplements.map((s) => [String(s._id), supplementImage(s)]));

  for (const order of orders) {
    for (const item of order.items) {
      if (item.itemType !== ITEM_TYPE.SUPPLEMENT || item.image) continue;
      // Unknown or non-ObjectId items keep their empty image; the UI shows its fallback.
      item.image = imageById.get(String(item.itemId)) ?? item.image;
    }
  }
  return orders;
}

export async function getOrderById(orderId: string) {
  await connectDB();

  if (!Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid Order ID');
  }
  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw new ValidationError('Order not found');
  }
  const [resolved] = await withResolvedItemImages([order]);
  return resolved;
}

export interface OrderFilters {
  orderStatus?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
}

export interface PaginatedOrdersResult {
  data: IOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllOrders(
  page: number = 1,
  limit: number = 10,
  filters?: OrderFilters | string,
): Promise<PaginatedOrdersResult> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (typeof filters === 'string') {
    if (filters) filter.orderStatus = filters;
  } else if (filters) {
    if (filters.orderStatus) filter.orderStatus = filters.orderStatus;
    if (filters.paymentStatus) filter.paymentStatus = filters.paymentStatus;
    if (filters.userId && filters.userId.trim()) filter.userId = toObjectId(filters.userId.trim());
    if (filters.dateFrom || filters.dateTo) {
      filter.createdAt = {};
      if (filters.dateFrom) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const d = new Date(filters.dateTo);
        d.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, Date>).$lte = d;
      }
    }
    if (
      (filters.minAmount !== undefined && filters.minAmount !== null) ||
      (filters.maxAmount !== undefined && filters.maxAmount !== null)
    ) {
      const amt = (filter.totalAmount as Record<string, number>) ?? {};
      if (filters.minAmount !== undefined && filters.minAmount !== null) {
        amt.$gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
        amt.$lte = filters.maxAmount;
      }
      filter.totalAmount = amt;
    }
  }
  const skip = (Math.max(1, page) - 1) * Math.max(1, Math.min(limit, 100));
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const [data, total] = await Promise.all([
    // Admin needs the buyer's identity, not a raw ObjectId — therapy/Deep Rest
    // orders carry no shipping address, so this is the only customer info there is.
    Order.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  return {
    data: await withResolvedItemImages(data),
    total,
    page: Math.max(1, page),
    limit: safeLimit,
    totalPages,
  };
}

export async function getUserOrders(userId: string) {
  await connectDB();

  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('Invalid User ID');
  }
  const rawOrders = await Order.find({ userId: toObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const orders = rawOrders
    .map((order) => ({
      ...order,
      items: order.items.filter((item) => item.itemType !== ITEM_TYPE.THERAPY),
    }))
    .filter((order) => order.items.length > 0);

  return (await withResolvedItemImages(orders)) as unknown as IOrder[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await connectDB();

  if (!Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid Order ID');
  }

  if (!ORDER_STATUS_VALUES.includes(status)) {
    throw new ValidationError('Invalid order status');
  }

  const order = await Order.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true, runValidators: true });

  if (!order) {
    throw new ValidationError('Order not found');
  }
  return order;
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: IOrder['paymentStatus'],
  paymentId?: string,
  razorpayOrderId?: string,
) {
  await connectDB();

  if (!Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid Order ID');
  }

  if (!PAYMENT_STATUS_VALUES.includes(paymentStatus)) {
    throw new ValidationError('Invalid payment status');
  }

  const updateData: Partial<IOrder> = { paymentStatus };
  if (paymentId) {
    updateData.paymentId = paymentId;
  }
  if (razorpayOrderId) {
    updateData.razorpayOrderId = razorpayOrderId;
  }

  const order = await Order.findByIdAndUpdate(orderId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    throw new ValidationError('Order not found');
  }

  if (paymentStatus === PAYMENT_STATUS.PAID) {
    const confirmedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: ORDER_STATUS.CONFIRMED },
      { new: true, runValidators: true },
    );
    if (!confirmedOrder) {
      throw new ValidationError('Order not found after confirming');
    }
    return confirmedOrder;
  }

  return order;
}
