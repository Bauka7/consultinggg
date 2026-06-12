import api, { unwrap } from './client';
import type { ApiResponse, PaginatedData, Offer, CreateOfferDto, OfferStatus } from './types';

export type { Offer, CreateOfferDto, OfferStatus };

export const offersApi = {
  list: (params?: { page?: number; limit?: number; status?: OfferStatus }) =>
    api.get<ApiResponse<PaginatedData<Offer>>>('/offers', { params }).then(unwrap),

  listByRequest: (requestId: string) =>
    api.get<ApiResponse<Offer[]>>('/offers', { params: { requestId } }).then(unwrap),

  get: (id: string) =>
    api.get<ApiResponse<Offer>>(`/offers/${id}`).then(unwrap),

  create: (payload: CreateOfferDto) =>
    api.post<ApiResponse<Offer>>('/offers', payload).then(unwrap),

  accept: (id: string) =>
    api.post<ApiResponse<{ id: string }>>(`/offers/${id}/accept`).then(unwrap),

  requestRevision: (id: string, note?: string) =>
    api.post<ApiResponse<Offer>>(`/offers/${id}/revision`, { note }).then(unwrap),
};
