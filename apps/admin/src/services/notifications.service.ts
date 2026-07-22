import api from './api';
import type { AdminNotification, AdminNotificationQueryParams, ApiResponse } from '../types';

export const notificationsService = {
  list: (params?: AdminNotificationQueryParams) =>
    api
      .get<ApiResponse<AdminNotification[]>>('/admin/notifications', { params })
      .then((response) => response.data),

  unreadCount: () =>
    api
      .get<ApiResponse<number>>('/admin/notifications/unread-count')
      .then((response) => response.data.data),

  markAllRead: () =>
    api
      .patch<ApiResponse<{ count: number }>>('/admin/notifications/mark-all-read')
      .then((response) => response.data.data),
};
