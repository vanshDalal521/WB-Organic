import { apiClient } from './client';

export const productsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => apiClient.get('/products', params),

  getOne: (idOrSlug: string) =>
    apiClient.get(`/products/${idOrSlug}`),

  getCategories: () =>
    apiClient.get('/products/categories'),

  getFeatured: () =>
    apiClient.get('/products/featured'),

  getTrending: () =>
    apiClient.get('/products/trending'),

  getByCategory: (categorySlug: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/products/category/${categorySlug}`, params),
};
