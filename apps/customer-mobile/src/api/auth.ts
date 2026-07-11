import { apiClient } from './client';

export const authApi = {
  sendOtp: (phone: string, countryCode?: string) =>
    apiClient.post('/auth/otp/send', { phone, countryCode }),

  verifyOtp: (phone: string, otp: string, countryCode?: string) =>
    apiClient.post('/auth/otp/verify', { phone, otp, countryCode }),

  refreshTokens: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  logoutAll: () =>
    apiClient.post('/auth/logout-all'),
};
