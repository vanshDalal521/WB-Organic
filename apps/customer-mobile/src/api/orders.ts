import { apiClient } from './client';

export const ordersApi = {
  create: (data: {
    addressId: string;
    deliveryDate: string;
    deliverySlotId?: string;
    paymentMethod: string;
    couponCode?: string;
    useWallet?: boolean;
    walletAmount?: number;
    notes?: string;
    items: {
      productVariantId: string;
      quantity: number;
    }[];
  }) => apiClient.post('/orders', data),

  getAll: (params?: { page?: number; limit?: number; tab?: string }) =>
    apiClient.get('/orders', params),

  getOne: (id: string) =>
    apiClient.get(`/orders/${id}`),

  cancel: (id: string, reason?: string) =>
    apiClient.delete(`/orders/${id}`),
};
