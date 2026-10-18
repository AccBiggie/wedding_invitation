import api from './api';
import axios from 'axios';
import type { ApiResponse } from '../types/api';

export type ImageCategory = 'avatar' | 'guest' | 'godparent' | 'gift' | 'storeCategory' | 'gallery' | 'banner' | 'other';
export interface ImageMetadata { id: string; url: string; entityType: ImageCategory; filename: string; mimeType: string; fileSize: number; width: number; height: number }
export const resolveImageUrl = (value: string) => value.startsWith('/api/images/') ? `${String(api.defaults.baseURL).replace(/\/api\/?$/, '')}${value}` : value;
export const imagesService = {
  async upload(file: File, category: ImageCategory, onProgress?: (percent: number) => void) {
    try {
      const response = await api.post<ApiResponse<ImageMetadata>>('/images', file, {
        headers: { 'Content-Type': file.type, 'X-Image-Category': category, 'X-Original-Filename': encodeURIComponent(file.name) },
        timeout: 60000,
        onUploadProgress: event => { if (event.total) onProgress?.(Math.round(100 * event.loaded / event.total)); }
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) throw new Error(error.response?.data?.message || 'Falha na conexão durante o envio da imagem.');
      throw error;
    }
  }
};
