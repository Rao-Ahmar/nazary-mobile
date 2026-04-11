import { apiClient } from './client';

export const otpApi = {
  sendCode: (phoneNumber: string) =>
    apiClient.post('/otp/send', { phone_number: phoneNumber }),

  verify: (phoneNumber: string, code: string) =>
    apiClient.post('/otp/verify', { phone_number: phoneNumber, code }),
};
