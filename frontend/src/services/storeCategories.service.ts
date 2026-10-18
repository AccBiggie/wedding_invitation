import api from './api';
import type { ApiResponse, ListData, ListFilters, PublicStoreCategory, PublicStoreCategoryPage, StoreCategory, StoreCategoryInput } from '../types/api';
export const storeCategoriesService = {
  list: (params: ListFilters) => api.get<ApiResponse<ListData<StoreCategory>>>('/store-categories', { params }).then(r => r.data.data),
  // Todas as categorias (ativas e inativas) em ordem, para selects e filtros do painel.
  listAll: () => api.get<ApiResponse<ListData<StoreCategory>>>('/store-categories', { params: { limit: 100, sortBy: 'order', sortOrder: 'asc' } }).then(r => r.data.data.data),
  getById: (id: string) => api.get<ApiResponse<StoreCategory>>(`/store-categories/${id}`).then(r => r.data.data),
  create: (data: StoreCategoryInput) => api.post<ApiResponse<StoreCategory>>('/store-categories', data).then(r => r.data.data),
  update: (id: string, data: StoreCategoryInput) => api.put<ApiResponse<StoreCategory>>(`/store-categories/${id}`, data).then(r => r.data.data),
  remove: (id: string) => api.delete(`/store-categories/${id}`),
  listPublic: () => api.get<ApiResponse<PublicStoreCategory[]>>('/public/store-categories').then(r => r.data.data),
  getPublicBySlug: (slug: string, page = 1, limit = 12) => api.get<ApiResponse<PublicStoreCategoryPage>>(`/public/store-categories/${encodeURIComponent(slug)}`, { params: { page, limit } }).then(r => r.data.data)
};
