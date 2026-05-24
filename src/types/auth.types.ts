export interface User {
  _id: string;
  phone: string;
  name: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignupRequest {
  phone: string;
  name: string;
}

export interface LoginRequest {
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

import { OtpPurpose } from '@/lib/constants/enums';

export type { OtpPurpose };

export interface SendOtpRequest {
  phone: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
  purpose: OtpPurpose;
}

export interface LoginResponseData {
  user: User;
  token: string;
  requireOtp?: boolean;
  phone?: string;
}
