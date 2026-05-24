export interface OtpDelivery {
  sendOtp(recipient: string, code: string): Promise<void>;
}
