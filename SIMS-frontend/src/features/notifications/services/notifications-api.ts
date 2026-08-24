import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { api } from '@/services/api-client';

import type { Notification, NotificationMarkReadPayload } from '../types/notification';

export const notificationsApi = {
  /**
   * List notifications for the authenticated user with optional is_read filtering.
   */
  async getNotifications(isRead?: boolean): Promise<Notification[]> {
    const params: Record<string, boolean> = {};
    if (isRead !== undefined) {
      params.is_read = isRead;
    }

    const response = await api.get<Notification[] | { results: Notification[] }>(
      API_ENDPOINTS.NOTIFICATIONS.ROOT,
      { params }
    );

    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray((response as { results: Notification[] }).results)) {
      return (response as { results: Notification[] }).results;
    }
    return [];
  },

  /**
   * Mark a single notification owned by the authenticated user as read.
   */
  async markNotificationAsRead(id: string): Promise<Notification> {
    const payload: NotificationMarkReadPayload = { is_read: true };
    return api.patch<Notification>(
      API_ENDPOINTS.NOTIFICATIONS.BY_ID(id),
      payload
    );
  },
};
