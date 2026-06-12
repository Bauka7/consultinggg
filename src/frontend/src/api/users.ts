import api, { unwrap } from './client';
import type { ApiResponse, User } from './types';

export type { User };

export const usersApi = {
  getMe: () => api.get<ApiResponse<User>>('/users/me').then(unwrap),

  updateMe: (payload: { name?: string; phone?: string; city?: string; country?: string; avatarUrl?: string }) =>
    api.patch<ApiResponse<User>>('/users/me', payload).then(unwrap),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResponse<{ message: string }>>('/users/me/change-password', payload).then(unwrap),
};
