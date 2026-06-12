import api, { unwrap } from './client';
import type { ApiResponse, PaginatedData, Thread, Message, SendMessageDto } from './types';

export type { Thread, Message, SendMessageDto };

export const messagingApi = {
  listThreads: () =>
    api.get<ApiResponse<Thread[]>>('/messaging/threads').then(unwrap),

  getThread: (id: string) =>
    api.get<ApiResponse<Thread>>(`/messaging/threads/${id}`).then(unwrap),

  getMessages: (threadId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<Message>>>(`/messaging/threads/${threadId}/messages`, { params }).then(unwrap),

  sendMessage: (payload: SendMessageDto) =>
    api.post<ApiResponse<Message>>(`/messaging/threads/${payload.threadId}/messages`, {
      body: payload.body,
      attachmentUrl: payload.attachmentUrl,
    }).then(unwrap),

  markRead: (messageId: string) =>
    api.patch<ApiResponse<Message>>(`/messaging/messages/${messageId}/read`).then(unwrap),

  getUnreadCount: () =>
    api.get<ApiResponse<{ unread: number }>>('/messaging/unread').then(unwrap),
};

export type ThreadKind = 'client' | 'factory' | 'support';
