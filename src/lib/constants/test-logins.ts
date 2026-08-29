import { ROLES, type Role } from './roles';

/**
 * Fixed test accounts that log in WITHOUT a real WhatsApp OTP.
 *
 * ⚠️ SECURITY: these are deliberately active in every environment, production
 * included, at the product owner's request. The phone/code pairs below are
 * guessable, so anyone who tries them on the live login page gets that account
 * — including ADMIN. Set `TEST_LOGINS_DISABLED=true` to switch the whole
 * mechanism off without a redeploy.
 *
 * The bypass only skips OTP *delivery*: `sendOtp` stores the fixed code through
 * the normal OTP store, so verification, TTL and attempt limits are unchanged.
 * The user documents themselves must exist — run `npx tsx --env-file=.env
 * scripts/seed-test-logins.ts` against the target database.
 */
export interface TestLogin {
  /** E.164, matching what `normalizePhone` produces. */
  phone: string;
  /** The 6-digit code that always works for this number. */
  otp: string;
  role: Role;
  name: string;
  email: string;
  /**
   * When true, checkout skips Razorpay entirely: the order is marked PAID
   * server-side and the customer lands straight on the success page.
   * ⚠️ Real stock is still deducted and real orders/sessions are still created.
   */
  bypassPayment?: boolean;
  /**
   * Present on THERAPIST accounts. A therapist User is useless without a
   * Therapist document to point `therapistId` at, so the seed script creates
   * this profile first and links the two.
   */
  therapistProfile?: {
    slug: string;
    qualifications: string[];
    /** Years — the schema types this as a Number, not a string like "12 years". */
    experience: number;
    languages: string[];
    specializations: string[];
    sessionFee: number;
    sessionDurationMins: number;
    bio: string;
  };
}

export const TEST_LOGINS: readonly TestLogin[] = [
  {
    phone: '+919999999999',
    otp: '999999',
    role: ROLES.ADMIN,
    name: 'Nervaya Test Admin',
    email: 'test-admin@nervaya.com',
  },
  {
    phone: '+918888888888',
    otp: '888888',
    role: ROLES.CUSTOMER,
    name: 'Nervaya Test Customer',
    email: 'test-customer@nervaya.com',
    bypassPayment: true,
  },
  {
    phone: '+917777777777',
    otp: '777777',
    role: ROLES.THERAPIST,
    name: 'Nervaya Test Therapist',
    email: 'test-therapist@nervaya.com',
    therapistProfile: {
      slug: 'nervaya-test-therapist',
      qualifications: ['MBBS', 'MD (Psychiatry)'],
      experience: 12,
      languages: ['English', 'Hindi', 'Telugu'],
      specializations: ['CBT', 'Anxiety', 'Sleep Disorders'],
      sessionFee: 1500,
      sessionDurationMins: 60,
      bio: 'Test therapist account used for internal QA. Not a real practitioner.',
    },
  },
] as const;

/** Kill switch: set `TEST_LOGINS_DISABLED=true` to disable the bypass entirely. */
export function testLoginsEnabled(): boolean {
  return process.env.TEST_LOGINS_DISABLED !== 'true';
}

/** The test account for an already-normalized E.164 phone, or `null`. */
export function getTestLogin(normalizedPhone: string): TestLogin | null {
  if (!testLoginsEnabled()) return null;
  return TEST_LOGINS.find((entry) => entry.phone === normalizedPhone) ?? null;
}

/** True when this phone's orders should skip Razorpay and settle as paid. */
export function hasPaymentBypass(normalizedPhone: string): boolean {
  return getTestLogin(normalizedPhone)?.bypassPayment === true;
}

/**
 * The customer and therapist test accounts are live in production (see the
 * warning above) and place real orders/bookings, but nobody reads their
 * inbox — transactional email to them is just noise. `test-admin@` is
 * excluded on purpose: an admin may actually want to see what a real send
 * looks like.
 */
const TEST_EMAILS_NO_SEND: ReadonlySet<string> = new Set(['test-customer@nervaya.com', 'test-therapist@nervaya.com']);

/** True when transactional email sends should be skipped for this address. */
export function isNoSendTestEmail(email: string | null | undefined): boolean {
  return !!email && TEST_EMAILS_NO_SEND.has(email.trim().toLowerCase());
}
