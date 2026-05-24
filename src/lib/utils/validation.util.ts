export function validateEmail(email: string): boolean {
  if (email.length > 320) return false;
  const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
  return emailRegex.test(email);
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Normalize a raw phone input to canonical E.164 (e.g. +919876543210).
 * - strips spaces, dashes, parentheses, and dots
 * - keeps an existing leading "+"
 * - converts a leading "00" international prefix to "+"
 * - prepends the default country code to a bare 10-digit number
 * Returns null when the input cannot be normalized to a valid E.164 number.
 */
export function normalizePhone(input: string, defaultCountry = '+91'): string | null {
  if (typeof input !== 'string') return null;

  let cleaned = input.trim().replace(/[\s\-().]/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('00')) {
    cleaned = `+${cleaned.slice(2)}`;
  } else if (!cleaned.startsWith('+') && /^\d{10}$/.test(cleaned)) {
    cleaned = `${defaultCountry}${cleaned}`;
  }

  return validatePhone(cleaned) ? cleaned : null;
}

export function validatePhone(phone: string): boolean {
  return typeof phone === 'string' && E164_REGEX.test(phone.trim());
}

const OTP_CODE_REGEX = /^\d{6}$/;

export function validateOtpCode(code: string): boolean {
  return typeof code === 'string' && OTP_CODE_REGEX.test(code.trim());
}
