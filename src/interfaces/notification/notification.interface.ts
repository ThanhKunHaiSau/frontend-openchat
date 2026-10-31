export type NotificationType = 'friend_request' | 'system' | 'message';

export interface INotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  senderAvatar?: string;
  senderName?: string;
  senderId?: string;
  createdAt: string;
  isRead: boolean;
  data?: any;
}

