import api from './api';
import type { ApiResponse, Godparent, GodparentInput, ListData, ListFilters } from '../types/api';
export type GodparentFilters = ListFilters & { role?: string };
export const godparentsService = {
  list: (params: GodparentFilters) => api.get<ApiResponse<ListData<Godparent>>>('/godparents', { params }).then(r => r.data.data),
  getById: (id: string) => api.get<ApiResponse<Godparent>>(`/godparents/${id}`).then(r => r.data.data),
  create: (data: GodparentInput) => api.post<ApiResponse<Godparent>>('/godparents', data).then(r => r.data.data),
  update: (id: string, data: GodparentInput) => api.put<ApiResponse<Godparent>>(`/godparents/${id}`, data).then(r => r.data.data),
  remove: (id: string) => api.delete(`/godparents/${id}`)
};
