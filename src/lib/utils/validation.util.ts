export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Normalize a raw phone input to canonical E.164 (e.g. +919876543210).
 * Mobile numbers must be exactly 10 digits (Indian mobile). An optional
 * country code (+91 / 91) or trunk prefix (leading 0) is stripped first.
 * Returns null when the result is not exactly 10 digits.
 */
export function normalizePhone(input: string, defaultCountry = '+91'): string | null {
  if (typeof input !== 'string') return null;

  // Reduce to digits, dropping an optional +91/91 country code or leading 0.
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (!/^\d{10}$/.test(digits)) {
    return null;
  }

  return `${defaultCountry}${digits}`;
}

export function validatePhone(phone: string): boolean {
  return typeof phone === 'string' && E164_REGEX.test(phone.trim());
}

const OTP_CODE_REGEX = /^\d{6}$/;

export function validateOtpCode(code: string): boolean {
  return typeof code === 'string' && OTP_CODE_REGEX.test(code.trim());
}

/**
 * Optional-email validator. Deliberately the same shape as the `match` rule on
 * the User schema, so the API and the model can never disagree about what a
 * valid address is.
 */
const EMAIL_REGEX = /^\S{1,64}@\S{1,255}\.\S{1,63}$/;

export function validateEmail(email: string): boolean {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}
