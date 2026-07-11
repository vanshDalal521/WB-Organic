import apiClient from './client';

export interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  latitude: number;
  longitude: number;
  products: { name: string; quantity: number; bottleCount: number }[];
  paymentType: 'COD' | 'PREPAID' | 'SUBSCRIPTION';
  totalAmount: number;
  status: 'PENDING' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'FAILED';
  deliveryTime?: string;
  failureReason?: string;
}

export interface RouteStop {
  id: string;
  sequence: number;
  customerName: string;
  customerPhone: string;
  address: string;
  latitude: number;
  longitude: number;
  products: { name: string; quantity: number }[];
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentType: string;
  totalAmount: number;
}

export interface BottleSummary {
  loaded: number;
  issued: number;
  collected: number;
  pending: number;
}

export interface DailySummary {
  totalStops: number;
  completed: number;
  pending: number;
  failed: number;
  cashToCollect: number;
  bottlesToIssue: number;
  bottlesToCollect: number;
}

export const deliveryApi = {
  getTodayRoute: () => apiClient.get('/delivery/today-route'),

  getRouteStops: () => apiClient.get('/delivery/route-stops'),

  startRoute: () => apiClient.post('/delivery/route/start'),

  completeStop: (stopId: string, data: { bottlesIssued: number; bottlesCollected: number; paymentCollected: number }) =>
    apiClient.post(`/delivery/stop/${stopId}/complete`, data),

  failStop: (stopId: string, reason: string) =>
    apiClient.post(`/delivery/stop/${stopId}/fail`, { reason }),

  endRoute: () => apiClient.post('/delivery/route/end'),

  getDeliveries: (params?: { status?: string; date?: string }) =>
    apiClient.get('/delivery/deliveries', { params }),

  getDeliveryById: (id: string) =>
    apiClient.get(`/delivery/deliveries/${id}`),

  getBottleSummary: () => apiClient.get('/delivery/bottles/summary'),

  getDailySummary: (date?: string) =>
    apiClient.get('/delivery/daily-summary', { params: { date } }),

  updateLocation: (latitude: number, longitude: number) =>
    apiClient.post('/delivery/location', { latitude, longitude }),
};
