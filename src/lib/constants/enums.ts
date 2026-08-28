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

/**
 * Whether a session's meeting link actually exists yet.
 *
 * Booking must never fail because a calendar API was unreachable, so a failure
 * degrades to `pending` and is swept up later — but it is now VISIBLE rather
 * than a silently empty meetLink that left the UI saying "generating..." forever.
 */
export const MEET_STATUS = {
  READY: 'ready',
  PENDING: 'pending',
  FAILED: 'failed',
} as const;

export type MeetStatusValue = (typeof MEET_STATUS)[keyof typeof MEET_STATUS];

export const MEET_STATUS_VALUES = Object.values(MEET_STATUS);

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
  /**
   * Attaching a WhatsApp number to an ALREADY-AUTHENTICATED account (a Google
   * signup adding a phone at booking or checkout).
   *
   * ⚠️ Reachable only through the requireAuth'd /api/auth/phone/* routes.
   * The public /api/auth/otp/* endpoints must keep rejecting it — they take no
   * session, so accepting it there would let anyone send OTPs to any number.
   */
  LINK_PHONE: 'link_phone',
} as const;

export type OtpPurpose = (typeof OTP_PURPOSE)[keyof typeof OTP_PURPOSE];

export const OTP_PURPOSE_VALUES = Object.values(OTP_PURPOSE);

/** The only purposes the unauthenticated OTP endpoints may be asked for. */
export const PUBLIC_OTP_PURPOSES: readonly OtpPurpose[] = [OTP_PURPOSE.LOGIN, OTP_PURPOSE.SIGNUP];

/** Type guard so a validated request body narrows to OtpPurpose for callers. */
export function isPublicOtpPurpose(value: string): value is OtpPurpose {
  return (PUBLIC_OTP_PURPOSES as readonly string[]).includes(value);
}

/**
 * How a user can authenticate. Stored as an ARRAY on the User, not a scalar:
 * linking is a first-class outcome (a Google user later adds a WhatsApp number,
 * a phone user later signs in with Google), and a scalar would force a lossy
 * "which one wins" answer.
 */
export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  WHATSAPP: 'whatsapp',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

export const AUTH_PROVIDER_VALUES = Object.values(AUTH_PROVIDERS);

/** Analytics label for how a session was established. */
export const SIGNUP_METHOD = {
  GOOGLE: 'Google',
  WHATSAPP: 'WhatsApp',
} as const;

export type SignupMethod = (typeof SIGNUP_METHOD)[keyof typeof SIGNUP_METHOD];

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

export const WHATSAPP_EVENT_TYPE = {
  STATUS: 'status',
  INBOUND_MESSAGE: 'inbound_message',
} as const;

export type WhatsAppEventType = (typeof WHATSAPP_EVENT_TYPE)[keyof typeof WHATSAPP_EVENT_TYPE];

export const WHATSAPP_EVENT_TYPE_VALUES = Object.values(WHATSAPP_EVENT_TYPE);

export const WHATSAPP_MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;

export type WhatsAppMessageStatus = (typeof WHATSAPP_MESSAGE_STATUS)[keyof typeof WHATSAPP_MESSAGE_STATUS];

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
