import { apiClient } from './client';

export const walletApi = {
  getBalance: () =>
    apiClient.get('/wallet'),

  getTransactions: (params?: { page?: number; limit?: number; type?: string }) =>
    apiClient.get('/wallet/transactions', params),

  addMoney: (amount: number) =>
    apiClient.post('/wallet/add-money', { amount }),
};
