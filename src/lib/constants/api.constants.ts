export const AUTH_API = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  OTP_SEND: '/auth/otp/send',
  OTP_VERIFY: '/auth/otp/verify',
  // Attaching a number to an already-signed-in account. Separate from the
  // public OTP endpoints because these require a session.
  PHONE_START: '/auth/phone/start',
  PHONE_VERIFY: '/auth/phone/verify',
} as const;
