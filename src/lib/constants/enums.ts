export const ROLES = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
  THERAPIST: 'THERAPIST',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const SESSION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);
export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);
export const SESSION_STATUS_VALUES = Object.values(SESSION_STATUS);

export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  NAME: 'Indian Rupee',
} as const;

export type CurrencyCode = (typeof CURRENCY)['CODE'];

export const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;

export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];

export const DISCOUNT_TYPE_VALUES = Object.values(DISCOUNT_TYPE);

export const NTHERAPY_YOUTUBE_VIDEOS = {
  HERO: 'https://www.youtube.com/watch?v=1ZYbU82GVz4',
  POPULAR_1: 'https://www.youtube.com/watch?v=aEqlQvczMJQ',
  POPULAR_2: 'https://www.youtube.com/watch?v=rkZl2gsLUp4',
  LANDING_HERO: 'https://www.youtube.com/watch?v=lTRiuFIWV54',
} as const;

export type NTherapyYouTubeVideo = (typeof NTHERAPY_YOUTUBE_VIDEOS)[keyof typeof NTHERAPY_YOUTUBE_VIDEOS];

export const OTP_PURPOSE = {
  LOGIN: 'login',
  SIGNUP: 'signup',
} as const;

export type OtpPurpose = (typeof OTP_PURPOSE)[keyof typeof OTP_PURPOSE];

export const AUTH_FORM_MODE = {
  LOGIN: 'login',
  SIGNUP: 'signup',
} as const;

export type AuthFormMode = (typeof AUTH_FORM_MODE)[keyof typeof AUTH_FORM_MODE];

export const AUTH_STEP = {
  CREDENTIALS: 'credentials',
  OTP: 'otp',
} as const;

export type AuthStep = (typeof AUTH_STEP)[keyof typeof AUTH_STEP];

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;

export type Gender = (typeof GENDER)[keyof typeof GENDER];

export const GENDER_OPTIONS = [
  { label: 'Male', value: GENDER.MALE },
  { label: 'Female', value: GENDER.FEMALE },
  { label: 'Other', value: GENDER.OTHER },
] as const;

export const ITEM_TYPE = {
  SUPPLEMENT: 'Supplement',
  DRIFT_OFF: 'DriftOff',
  THERAPY: 'Therapy',
} as const;

export type ItemType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];
