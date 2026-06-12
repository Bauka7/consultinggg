import api, { unwrap } from './client';
import type { ApiResponse, Invite } from './types';

export type { Invite };

export interface ValidateInviteResult {
  valid: boolean;
  email: string;
  role: 'consultant' | 'factory';
  factory?: { id: string; name: string } | null;
  inviter?: { id: string; name: string } | null;
  expiresAt: string;
}

export const invitesApi = {
  // Admin / factory_admin creates an invite
  create: (payload: { role: 'consultant' | 'factory'; email: string; factoryId?: string }) =>
    api.post<ApiResponse<Invite>>('/invites', payload).then(unwrap),

  list: () => api.get<ApiResponse<Invite[]>>('/invites').then(unwrap),

  validate: (token: string) =>
    api.get<ApiResponse<ValidateInviteResult>>(`/invites/validate/${token}`).then(unwrap),

  revoke: (id: string) =>
    api.post<ApiResponse<Invite>>(`/invites/${id}/revoke`).then(unwrap),
};
