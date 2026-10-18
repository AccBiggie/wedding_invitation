import api from './api';
import type { ApiResponse, ListData, ListFilters, PublicStoreCategory, StoreCategory, StoreCategoryInput } from '../types/api';
export const storeCategoriesService = {
  list: (params: ListFilters) => api.get<ApiResponse<ListData<StoreCategory>>>('/store-categories', { params }).then(r => r.data.data),
  getById: (id: string) => api.get<ApiResponse<StoreCategory>>(`/store-categories/${id}`).then(r => r.data.data),
  create: (data: StoreCategoryInput) => api.post<ApiResponse<StoreCategory>>('/store-categories', data).then(r => r.data.data),
  update: (id: string, data: StoreCategoryInput) => api.put<ApiResponse<StoreCategory>>(`/store-categories/${id}`, data).then(r => r.data.data),
  remove: (id: string) => api.delete(`/store-categories/${id}`),
  listPublic: () => api.get<ApiResponse<PublicStoreCategory[]>>('/public/store-categories').then(r => r.data.data)
};
