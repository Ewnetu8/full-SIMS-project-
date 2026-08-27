import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '../services/notifications-api';

import type { Notification } from '../types/notification';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (isRead?: boolean) => ['notifications', 'list', { isRead }] as const,
};

/**
 * Hook to fetch notifications for the authenticated user.
 */
export function useNotifications(isRead?: boolean) {
  return useQuery<Notification[], Error>({
    queryKey: NOTIFICATION_QUERY_KEYS.list(isRead),
    queryFn: () => notificationsApi.getNotifications(isRead),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch unread notification count.
 */
export function useUnreadNotificationCount() {
  const query = useQuery<Notification[], Error>({
    queryKey: NOTIFICATION_QUERY_KEYS.list(false),
    queryFn: () => notificationsApi.getNotifications(false),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    unreadCount: query.data?.length ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Mutation hook to mark a notification as read and invalidate queries.
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation hook to mark multiple notifications as read and invalidate queries.
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => notificationsApi.markNotificationAsRead(id)));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

