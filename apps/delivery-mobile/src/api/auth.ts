import apiClient from './client';

export interface LoginPayload {
  userId: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
    role: string;
    vehicleType: string;
    vehicleNumber: string;
  };
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/delivery/login', data),

  logout: () => apiClient.post('/auth/logout'),

  getProfile: () => apiClient.get('/delivery/profile'),

  updateFCMToken: (fcmToken: string) =>
    apiClient.post('/delivery/fcm-token', { fcmToken }),

  markAttendance: (status: 'checkin' | 'checkout') =>
    apiClient.post('/delivery/attendance', { status }),

  getAttendanceHistory: (date?: string) =>
    apiClient.get('/delivery/attendance', { params: { date } }),
};
