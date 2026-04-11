import { apiClient } from './client';
import type { AppNotification } from '../types';

interface NotificationsResponse {
  data: AppNotification[];
  meta: { currentPage: number; totalPages: number; totalCount: number; unreadCount: number };
}

export const notificationsApi = {
  getAll: (page = 1) =>
    apiClient.get<NotificationsResponse>('/notifications', { params: { page } }),

  markRead: (id: string) =>
    apiClient.patch<AppNotification>(`/notifications/${id}/read`),

  readAll: () =>
    apiClient.patch('/notifications/read_all'),
};
