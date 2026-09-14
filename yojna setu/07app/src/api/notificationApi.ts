import apiClient from './client';
import type { NotificationItem, NotificationPreference } from '@/types';

export const notificationApi = {
  getNotifications: (page = 1, size = 20) =>
    apiClient.get<{ items: NotificationItem[]; total: number; unread_count: number }>('/notifications', { params: { page, size } }).then((r) => r.data),

  getUnreadCount: () =>
    apiClient.get<{ unread_count: number }>('/notifications/unread-count').then((r) => r.data),

  markRead: (id: number) =>
    apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.patch('/notifications/read-all').then((r) => r.data),

  getPreferences: () =>
    apiClient.get<NotificationPreference>('/notifications/preferences').then((r) => r.data),

  updatePreferences: (prefs: Partial<NotificationPreference>) =>
    apiClient.put<NotificationPreference>('/notifications/preferences', prefs).then((r) => r.data),
};
