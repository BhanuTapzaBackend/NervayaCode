export function validateEmail(email: string): boolean {
  if (email.length > 320) return false;
  const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number',
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one special character',
    };
  }

  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    return {
      valid: false,
      message: 'Password is too common. Please choose a stronger password',
    };
  }

  return { valid: true };
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

const OTP_CODE_REGEX = /^\d{6}$/;

export function validateOtpCode(code: string): boolean {
  return typeof code === 'string' && OTP_CODE_REGEX.test(code.trim());
}
