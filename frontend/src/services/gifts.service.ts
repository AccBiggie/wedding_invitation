import api from './api';
import type { ApiResponse, GiftProduct, GiftInput, ListData, ListFilters } from '../types/api';
// categoryId: id da categoria, 'none' para produtos sem categoria ou '' para todas.
export type GiftFilters = ListFilters & { categoryId?: string; minPrice?: number | ''; maxPrice?: number | '' };
export const giftsService = {
  list: (params: GiftFilters) => api.get<ApiResponse<ListData<GiftProduct>>>('/gift-products', { params }).then(r => r.data.data),
  listByCategory: (categoryId: string, params: GiftFilters = {}) => api.get<ApiResponse<ListData<GiftProduct>>>('/gift-products', { params: { ...params, categoryId } }).then(r => r.data.data),
  getById: (id: string) => api.get<ApiResponse<GiftProduct>>(`/gift-products/${id}`).then(r => r.data.data),
  create: (data: GiftInput) => api.post<ApiResponse<GiftProduct>>('/gift-products', data).then(r => r.data.data),
  update: (id: string, data: GiftInput) => api.put<ApiResponse<GiftProduct>>(`/gift-products/${id}`, data).then(r => r.data.data),
  remove: (id: string) => api.delete(`/gift-products/${id}`)
};
