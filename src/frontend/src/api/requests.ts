import api, { unwrap } from './client';
import type { ApiResponse, PaginatedData, SourcingRequest, CreateRequestDto, RequestStatus } from './types';

export type { SourcingRequest, CreateRequestDto, RequestStatus };

export const requestsApi = {
  list: (params?: { page?: number; limit?: number; status?: RequestStatus; search?: string }) =>
    api.get<ApiResponse<PaginatedData<SourcingRequest>>>('/requests', { params }).then(unwrap),

  get: (id: string) =>
    api.get<ApiResponse<SourcingRequest>>(`/requests/${id}`).then(unwrap),

  create: (payload: CreateRequestDto) =>
    api.post<ApiResponse<SourcingRequest>>('/requests', payload).then(unwrap),

  updateStatus: (id: string, status: RequestStatus) =>
    api.patch<ApiResponse<SourcingRequest>>(`/requests/${id}/status`, { status }).then(unwrap),

  decline: (id: string) =>
    api.post<ApiResponse<SourcingRequest>>(`/requests/${id}/decline`).then(unwrap),

  assign: (id: string, consultantId: string) =>
    api.post<ApiResponse<SourcingRequest>>(`/requests/${id}/assign`, { consultantId }).then(unwrap),
};
