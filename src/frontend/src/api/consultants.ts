import api, { unwrap } from './client';
import type { ApiResponse, PaginatedData, ConsultantProfile, Review } from './types';

export type { ConsultantProfile };

export interface ApplyConsultantDto {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  years: number;
  languages: string[];
  motivation?: string;
  categoryIds?: string[];
}

export const consultantsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    api.get<ApiResponse<PaginatedData<ConsultantProfile>>>('/consultants', { params }).then(unwrap),

  get: (id: string) =>
    api.get<ApiResponse<ConsultantProfile>>(`/consultants/${id}`).then(unwrap),

  getReviews: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<Review>>>(`/consultants/${id}/reviews`, { params }).then(unwrap),

  myProfile: () =>
    api.get<ApiResponse<ConsultantProfile>>('/consultants/me/profile').then(unwrap),

  updateMyProfile: (payload: Partial<ConsultantProfile> & { categoryIds?: string[] }) =>
    api.patch<ApiResponse<ConsultantProfile>>('/consultants/me/profile', payload).then(unwrap),

  applyToFactory: (factoryId: string, pitch?: string) =>
    api.post<ApiResponse<unknown>>(`/consultants/me/apply-factory/${factoryId}`, { pitch }).then(unwrap),

  // Public application (no account yet)
  apply: (payload: ApplyConsultantDto) =>
    api.post<ApiResponse<unknown>>('/consultants/apply', payload).then(unwrap),
};
