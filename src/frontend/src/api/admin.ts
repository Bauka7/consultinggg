import api, { unwrap } from './client';
import type {
  ApiResponse,
  PaginatedData,
  User,
  Factory,
  ConsultantApplication,
  PlatformSettings,
  AuditLog,
  Review,
  Order,
} from './types';

export type { ConsultantApplication, PlatformSettings, AuditLog };

export interface DashboardStats {
  totalUsers: number;
  totalConsultants: number;
  totalFactories: number;
  totalOrders: number;
  activeOrders: number;
  pendingReviews: number;
  pendingApplications: number;
  blockedUsers: number;
  usersByRole: { role: string; _count: number }[];
  recentOrders: Order[];
}

export const adminApi = {
  // Dashboard
  getDashboard: () => api.get<ApiResponse<DashboardStats>>('/admin/dashboard').then(unwrap),

  // Settings
  getSettings: () => api.get<ApiResponse<PlatformSettings>>('/admin/settings').then(unwrap),
  updateSettings: (payload: Partial<PlatformSettings>) =>
    api.patch<ApiResponse<PlatformSettings>>('/admin/settings', payload).then(unwrap),

  // Users
  listUsers: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) =>
    api.get<ApiResponse<PaginatedData<User>>>('/admin/users', { params }).then(unwrap),
  blockUser: (id: string) => api.post<ApiResponse<unknown>>(`/admin/users/${id}/block`).then(unwrap),
  unblockUser: (id: string) => api.post<ApiResponse<unknown>>(`/admin/users/${id}/unblock`).then(unwrap),

  // Consultant applications
  listConsultantApps: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<PaginatedData<ConsultantApplication>>>('/admin/consultant-applications', { params }).then(unwrap),
  moderateApp: (id: string, status: 'trial' | 'approved' | 'rejected') =>
    api.post<ApiResponse<unknown>>(`/admin/consultant-applications/${id}/moderate`, { status }).then(unwrap),
  verifyConsultant: (id: string) =>
    api.post<ApiResponse<unknown>>(`/admin/consultants/${id}/verify`).then(unwrap),
  setConsultantType: (id: string, type: 'specialized' | 'general') =>
    api.patch<ApiResponse<unknown>>(`/admin/consultants/${id}/type`, { type }).then(unwrap),

  // Factories
  listFactories: (params?: { page?: number; limit?: number; verified?: boolean; search?: string }) =>
    api.get<ApiResponse<PaginatedData<Factory>>>('/admin/factories', { params }).then(unwrap),
  verifyFactory: (id: string) => api.post<ApiResponse<unknown>>(`/admin/factories/${id}/verify`).then(unwrap),
  unverifyFactory: (id: string) => api.post<ApiResponse<unknown>>(`/admin/factories/${id}/unverify`).then(unwrap),

  // Factory-consultant link applications
  listFactoryApps: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<ApiResponse<PaginatedData<unknown>>>('/admin/factory-applications', { params }).then(unwrap),

  // Orders oversight
  listOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<ApiResponse<PaginatedData<Order>>>('/admin/orders', { params }).then(unwrap),

  // Reviews moderation
  listPendingReviews: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<Review>>>('/admin/reviews/pending', { params }).then(unwrap),

  // Audit
  listAudit: (params?: { page?: number; limit?: number; actorId?: string }) =>
    api.get<ApiResponse<{ items: AuditLog[]; total: number }>>('/admin/audit-logs', { params }).then(unwrap),
};
