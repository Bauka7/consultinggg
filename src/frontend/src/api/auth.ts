import api, { unwrap } from './client';
import type { ApiResponse, AuthResult, User } from './types';

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResult>>('/auth/login', payload).then(unwrap),

  register: (payload: { email: string; password: string; name: string; role?: string; phone?: string; city?: string; country?: string }) =>
    api.post<ApiResponse<AuthResult>>('/auth/register', payload).then(unwrap),

  registerWithInvite: (payload: { inviteToken: string; email: string; password: string; name: string; phone?: string; city?: string }) =>
    api.post<ApiResponse<AuthResult>>('/auth/register/invite', payload).then(unwrap),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email }).then(unwrap),

  resetPassword: (token: string, newPassword: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, newPassword }).then(unwrap),

  me: () => api.get<ApiResponse<User>>('/users/me').then(unwrap),
};
