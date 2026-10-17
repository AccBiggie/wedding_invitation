import api from './api';
import type { ApiResponse, PixGenerated, PixInput, PixSettings } from '../types/api';
export const pixService = {
  getSettings: () => api.get<ApiResponse<PixSettings | null>>('/pix/settings').then(r => r.data.data),
  saveSettings: (data: PixInput) => api.put<ApiResponse<PixSettings>>('/pix/settings', data).then(r => r.data.data),
  getStatus: () => api.get<ApiResponse<{ active: boolean }>>('/pix/status').then(r => r.data.data),
  generate: (amount: number) => api.post<ApiResponse<PixGenerated>>('/pix/generate', { amount }).then(r => r.data.data)
};
