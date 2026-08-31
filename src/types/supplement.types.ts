import { Types } from 'mongoose';
import { PaymentStatus, OrderStatus, type DiscountType, type ItemType } from '@/lib/constants/enums';

export interface StarDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}
export interface AdditionalSection {
  title: string;
  content: string[];
}

export interface Supplement {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  ingredients: string[];
  benefits: string[];
  isActive: boolean;
  originalPrice?: number;
  shortDescription?: string;
  suggestedUse?: string;
  images?: string[];
  capsuleCount?: number;
  unitLabel?: string;
  averageRating?: number;
  reviewCount?: number;
  starDistribution?: StarDistribution;
  additionalSections?: AdditionalSection[];
  shippingAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  userDisplayName?: string;
  rating: number;
  comment?: string;
  isVisible?: boolean;
  itemType?: 'Supplement' | 'DriftOff' | 'Therapy';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse {
  data: Review[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SupplementFormData {
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  ingredients: string[];
  benefits: string[];
  isActive: boolean;
  originalPrice?: number;
  shortDescription?: string;
  suggestedUse?: string;
  images?: string[];
  additionalSections?: AdditionalSection[];
  shippingAddress?: string;
}

export interface CartItem {
  itemType: ItemType;
  itemId: Types.ObjectId | Supplement | string;
  name?: string;
  image?: string;
  quantity: number;
  price: number;
  /**
   * Denormalised stock, carried only by guest carts. Server carts populate
   * `itemId` with the full Supplement, so the live stock is read from there;
   * guest carts keep `itemId` as a bare string and would otherwise have no
   * upper bound to enforce.
   */
  stock?: number;
}

export interface Cart {
  _id: string;
  userId: Types.ObjectId | string;
  items: CartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  itemType: ItemType;
  itemId: Types.ObjectId | Supplement | string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface SavedAddress extends ShippingAddress {
  _id: string;
  label: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
}

export interface PromoCode {
  _id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiryDate: Date | string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
  valid?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreatePromoCodeDto {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiryDate: Date | string;
  usageLimit?: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePromoCodeDto extends Partial<CreatePromoCodeDto> {
  isActive?: boolean;
}

/** Shape of `Order.userId` once the admin queries populate it. */
export interface OrderCustomerSummary {
  _id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface Order {
  _id: string;
  userId: Types.ObjectId | string | OrderCustomerSummary;
  items: OrderItem[];
  totalAmount: number;
  paymentId?: string;
  razorpayOrderId?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: ShippingAddress;
  promoCode?: string;
  promoDiscount?: number;
  createdAt: Date;
  updatedAt: Date;
}
