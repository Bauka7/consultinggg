import api, { unwrap } from './client';
import type { ApiResponse, Category } from './types';

export type { Category };

export const categoriesApi = {
  list: () => api.get<ApiResponse<Category[]>>('/categories').then(unwrap),
  get: (id: string) => api.get<ApiResponse<Category>>(`/categories/${id}`).then(unwrap),
  getBySlug: (slug: string) => api.get<ApiResponse<Category>>(`/categories/slug/${slug}`).then(unwrap),
};
