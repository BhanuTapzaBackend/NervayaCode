import type { ItemType } from '@/lib/constants/enums';
import type { Cart, CartItem } from '@/types/supplement.types';

const STORAGE_KEY = 'nervaya_guest_cart';
const GUEST_CART_EVENT = 'guest-cart-changed';

export interface GuestCartItem {
  itemId: string;
  itemType: ItemType;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  metadata?: Record<string, unknown>;
}

function readStore(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(items: GuestCartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(GUEST_CART_EVENT));
}

export function getGuestCartItems(): GuestCartItem[] {
  return readStore();
}

export function addToGuestCart(item: {
  itemId: string;
  itemType: ItemType;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  metadata?: Record<string, unknown>;
}): GuestCartItem[] {
  const items = readStore();
  const existing = items.find((i) => i.itemId === item.itemId && i.itemType === item.itemType);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push({ ...item });
  }
  writeStore(items);
  return items;
}

export function updateGuestCartItemQuantity(itemId: string, itemType: ItemType, quantity: number): GuestCartItem[] {
  let items = readStore();
  if (quantity <= 0) {
    items = items.filter((i) => !(i.itemId === itemId && i.itemType === itemType));
  } else {
    const existing = items.find((i) => i.itemId === itemId && i.itemType === itemType);
    if (existing) existing.quantity = quantity;
  }
  writeStore(items);
  return items;
}

export function removeFromGuestCart(itemId: string, itemType: ItemType): GuestCartItem[] {
  const items = readStore().filter((i) => !(i.itemId === itemId && i.itemType === itemType));
  writeStore(items);
  return items;
}

export function clearGuestCart(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(GUEST_CART_EVENT));
}

export function guestCartToDisplayCart(items: GuestCartItem[]): Cart {
  const cartItems: CartItem[] = items.map((i) => ({
    itemType: i.itemType,
    itemId: i.itemId,
    name: i.name,
    image: i.image,
    quantity: i.quantity,
    price: i.price,
  }));
  const totalAmount = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return {
    _id: 'guest-cart',
    userId: 'guest',
    items: cartItems,
    totalAmount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const GUEST_CART_CHANGED_EVENT = GUEST_CART_EVENT;
