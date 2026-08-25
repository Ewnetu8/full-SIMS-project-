export interface Notification {
  id: string;
  recipient: string;
  message_body: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationMarkReadPayload {
  is_read: boolean;
}

export type NotificationFilterTab = 'all' | 'unread' | 'read';
