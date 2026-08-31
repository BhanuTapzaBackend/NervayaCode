import Cart, { ICartItem } from '@/lib/models/cart.model';
import Supplement from '@/lib/models/supplement.model';
import Therapist from '@/lib/models/therapist.model';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';
import { ITEM_TYPE, type ItemType } from '@/lib/constants/enums';
import { DRIFT_OFF_SESSION_IMAGE } from '@/lib/constants/driftOff.constants';
import Session from '@/lib/models/session.model';
import { toObjectId } from '@/lib/utils/objectId.util';
import { supplementImage } from '@/utils/supplement.util';

// NOTE: Services intentionally do NOT call handleError(). They throw domain
// errors (ValidationError/AppError) and let DB errors propagate. The route
// handler's handleError() is the single place that maps an error to an HTTP
// response. Calling handleError() here would return a plain object, which the
// route's handleError() then misclassifies as a generic 500.

export async function getCartByUserId(userId: string) {
  await connectDB();

  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('Invalid User ID');
  }

  const userObjectId = toObjectId(userId);
  let cart = await Cart.findOne({ userId: userObjectId });
  if (!cart) {
    cart = await Cart.create({ userId: userObjectId, items: [], totalAmount: 0 });
  }

  // Manually populate Supplement and Therapist items to handle mixed types gracefully
  const cartObj = JSON.parse(JSON.stringify(cart));
  const supplementIds = cartObj.items
    .filter((i: ICartItem) => i.itemType === ITEM_TYPE.SUPPLEMENT)
    .map((i: ICartItem) => i.itemId);
  const therapyIds = cartObj.items
    .filter((i: ICartItem) => i.itemType === ITEM_TYPE.THERAPY)
    .map((i: ICartItem) => i.itemId);

  const [supplements, therapists] = await Promise.all([
    Supplement.find({ _id: { $in: supplementIds } }).lean(),
    Therapist.find({ _id: { $in: therapyIds } }).lean(),
  ]);

  const supplementMap = new Map(supplements.map((s) => [s._id.toString(), s]));
  const therapyMap = new Map(therapists.map((t) => [t._id.toString(), t]));

  cartObj.items = cartObj.items.map((item: ICartItem) => {
    if (item.itemType === ITEM_TYPE.SUPPLEMENT) {
      return { ...item, itemId: supplementMap.get(item.itemId?.toString()) || item.itemId };
    }
    if (item.itemType === ITEM_TYPE.THERAPY) {
      return { ...item, itemId: therapyMap.get(item.itemId?.toString()) || item.itemId };
    }
    return item;
  });

  return cartObj;
}

export async function addToCart(
  userId: string,
  itemId: string,
  quantity: number,
  itemType: ItemType = ITEM_TYPE.SUPPLEMENT,
  name?: string,
  price?: number,
  image?: string,
  metadata?: Record<string, unknown>,
) {
  await connectDB();

  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('Invalid User ID');
  }
  if (quantity < 1) {
    throw new ValidationError('Quantity must be at least 1');
  }

  let finalPrice = price || 0;
  let finalName = name || '';
  // resolvedImage allows us to derive the image server-side without mutating the param
  let resolvedImage: string | undefined = image;

  if (itemType === ITEM_TYPE.SUPPLEMENT) {
    if (!Types.ObjectId.isValid(itemId)) {
      throw new ValidationError('Invalid Supplement ID');
    }
    const supplement = await Supplement.findById(itemId);
    if (!supplement) throw new ValidationError('Supplement not found');
    if (!supplement.isActive) throw new ValidationError('Supplement is not available');
    if (supplement.stock < quantity) throw new ValidationError('Insufficient stock');

    finalPrice = supplement.price;
    finalName = supplement.name;
    resolvedImage = supplementImage(supplement);
  } else if (itemType === ITEM_TYPE.DRIFT_OFF) {
    // Deep Rest session has no stock check, but we need price
    if (!finalPrice || finalPrice <= 0) {
      throw new ValidationError('Price is required for Deep Rest items');
    }
    if (!finalName) {
      finalName = 'Deep Rest Session';
    }
    // Always use the canonical thumbnail for Deep Rest items
    resolvedImage = DRIFT_OFF_SESSION_IMAGE;
  } else if (itemType === ITEM_TYPE.THERAPY) {
    if (!Types.ObjectId.isValid(itemId)) {
      throw new ValidationError('Invalid Therapist ID');
    }
    const therapist = await Therapist.findById(itemId);
    if (!therapist) {
      throw new ValidationError('Therapist not found');
    }
    if (!therapist.isAvailable) {
      throw new ValidationError('Therapist is not available');
    }

    const { date, slot } = metadata || {};
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
    }

    finalPrice = therapist.sessionFee || 0;
    finalName = `Therapy Session with ${therapist.name}`;
    resolvedImage = therapist.image || '';
  }

  const userObjectId = toObjectId(userId);
  let cart = await Cart.findOne({ userId: userObjectId });
  if (!cart) {
    cart = await Cart.create({ userId: userObjectId, items: [], totalAmount: 0 });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.itemId.toString() === itemId && item.itemType === itemType,
  );

  if (existingItemIndex > -1) {
    if (itemType === ITEM_TYPE.SUPPLEMENT) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      const supplement = await Supplement.findById(itemId);
      if (supplement && newQuantity > supplement.stock) {
        throw new ValidationError('Insufficient stock');
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Digital items always have quantity 1
      cart.items[existingItemIndex].quantity = 1;
    }
    if (metadata) {
      cart.items[existingItemIndex].metadata = metadata;
    }
  } else {
    cart.items.push({
      itemType,
      itemId: itemType === ITEM_TYPE.SUPPLEMENT || itemType === ITEM_TYPE.THERAPY ? new Types.ObjectId(itemId) : itemId,
      quantity: itemType === ITEM_TYPE.SUPPLEMENT ? quantity : 1,
      price: finalPrice,
      name: finalName,
      ...(resolvedImage ? { image: resolvedImage } : {}),
      ...(metadata ? { metadata } : {}),
    });
  }

  await cart.save();
  return await getCartByUserId(userId);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  quantity: number,
  itemType: ItemType = ITEM_TYPE.SUPPLEMENT,
) {
  await connectDB();

  if (!userId || typeof userId !== 'string') throw new ValidationError('Invalid User ID');
  if (quantity < 1) throw new ValidationError('Quantity must be at least 1');

  if (itemType === ITEM_TYPE.SUPPLEMENT) {
    if (!Types.ObjectId.isValid(itemId)) throw new ValidationError('Invalid Supplement ID');
    const supplement = await Supplement.findById(itemId);
    if (!supplement) throw new ValidationError('Supplement not found');
    if (supplement.stock < quantity) throw new ValidationError('Insufficient stock');
  }

  const cart = await Cart.findOne({ userId: toObjectId(userId) });
  if (!cart) throw new ValidationError('Cart not found');

  const itemIndex = cart.items.findIndex((item) => item.itemId.toString() === itemId && item.itemType === itemType);

  if (itemIndex === -1) throw new ValidationError('Item not found in cart');

  const finalQuantity = itemType === ITEM_TYPE.SUPPLEMENT ? quantity : 1;
  cart.items[itemIndex].quantity = finalQuantity;
  await cart.save();

  return await getCartByUserId(userId);
}

export async function removeFromCart(userId: string, itemId: string, itemType: ItemType = ITEM_TYPE.SUPPLEMENT) {
  await connectDB();

  if (!userId) throw new ValidationError('Invalid User ID');

  const cart = await Cart.findOne({ userId: toObjectId(userId) });
  if (!cart) throw new ValidationError('Cart not found');

  cart.items = cart.items.filter((item) => !(item.itemId.toString() === itemId && item.itemType === itemType));

  await cart.save();
  return await getCartByUserId(userId);
}

export async function clearCart(userId: string) {
  await connectDB();

  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('Invalid User ID');
  }

  const cart = await Cart.findOne({ userId: toObjectId(userId) });
  if (!cart) {
    throw new ValidationError('Cart not found');
  }

  cart.items = [];
  await cart.save();
  return cart;
}
