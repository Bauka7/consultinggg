import api, { unwrap } from './client';
import type { ApiResponse, PaginatedData, Factory, Product, Certificate } from './types';

export type { Factory, Product, Certificate };

export const factoriesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; categoryId?: string; province?: string }) =>
    api.get<ApiResponse<PaginatedData<Factory>>>('/factories', { params }).then(unwrap),

  get: (id: string) =>
    api.get<ApiResponse<Factory>>(`/factories/${id}`).then(unwrap),

  // Admin only — creates an unowned factory (owner assigned later via factory invite)
  create: (payload: {
    name: string;
    nameCn?: string;
    city?: string;
    province?: string;
    about?: string;
    staff?: string;
    area?: string;
    leadTime?: string;
    established?: number;
    categoryIds?: string[];
  }) => api.post<ApiResponse<Factory>>('/factories', payload).then(unwrap),

  // Factory-admin: the factory they own (includes all products + certs)
  myFactory: () =>
    api.get<ApiResponse<Factory>>('/factories/me/factory').then(unwrap),

  updateMyFactory: (payload: Partial<Factory> & { categoryIds?: string[] }) =>
    api.patch<ApiResponse<Factory>>('/factories/me/factory', payload).then(unwrap),

  update: (id: string, payload: Partial<Factory> & { categoryIds?: string[] }) =>
    api.patch<ApiResponse<Factory>>(`/factories/${id}`, payload).then(unwrap),

  verify: (id: string) =>
    api.post<ApiResponse<Factory>>(`/factories/${id}/verify`).then(unwrap),

  getApplications: (id: string) =>
    api.get<ApiResponse<unknown[]>>(`/factories/${id}/applications`).then(unwrap),

  approveApplication: (factoryId: string, appId: string) =>
    api.post<ApiResponse<unknown>>(`/factories/${factoryId}/applications/${appId}/approve`).then(unwrap),

  rejectApplication: (factoryId: string, appId: string) =>
    api.post<ApiResponse<unknown>>(`/factories/${factoryId}/applications/${appId}/reject`).then(unwrap),
};
