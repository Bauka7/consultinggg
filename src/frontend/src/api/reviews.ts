import api, { unwrap } from './client';
import type { ApiResponse, PaginatedData, Review, CreateReviewDto, ReviewStatus } from './types';

export type { Review, CreateReviewDto, ReviewStatus };

export const reviewsApi = {
  // Client creates a review for a consultant (stays pending until admin approves)
  create: (payload: CreateReviewDto) =>
    api.post<ApiResponse<Review>>('/reviews', payload).then(unwrap),

  // Admin moderation
  listAll: (params?: { page?: number; limit?: number; status?: ReviewStatus; consultantId?: string }) =>
    api.get<ApiResponse<PaginatedData<Review>>>('/reviews', { params }).then(unwrap),

  listPending: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<Review>>>('/reviews/pending', { params }).then(unwrap),

  listFlagged: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<Review>>>('/reviews/flagged', { params }).then(unwrap),

  approve: (id: string) =>
    api.post<ApiResponse<{ message: string }>>(`/reviews/${id}/approve`).then(unwrap),

  remove: (id: string) =>
    api.post<ApiResponse<{ message: string }>>(`/reviews/${id}/remove`).then(unwrap),
};
