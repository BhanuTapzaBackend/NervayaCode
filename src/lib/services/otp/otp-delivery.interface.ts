export interface OtpDelivery {
  sendOtp(email: string, code: string): Promise<void>;
}
