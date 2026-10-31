import { apiClient } from './apiClient';
import type { INotificationItem } from '../interfaces';

interface IGetNotificationsResponse {
  success: boolean;
  message?: string;
  data: {
    notifications: Array<{
      _id: string;
      sender: {
        id: string;
        username: string;
        avatar?: string;
      };
      receiver: {
        id: string;
        username?: string;
        avatar?: string;
      };
      type: string;
      content: string;
      isRead: boolean;
      createdAt: string;
    }>;
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  };
}

export const notificationService = {
  /**
   * 1. Lấy danh sách thông báo từ Backend
   */
  getNotifications: async (page = 1, limit = 20): Promise<INotificationItem[]> => {
    try {
      const response = await apiClient.get<IGetNotificationsResponse>('/notifications', {
        params: { page, limit },
      });

      if (response.data?.success && response.data?.data?.notifications) {
        // Map dữ liệu từ MongoDB sang format của Frontend
        return response.data.data.notifications.map((n) => ({
          id: n._id,
          title: n.type === 'friend_request' ? 'Lời mời kết bạn mới' : 'Thông báo mới',
          message: n.content,
          type: (n.type as any) || 'system',
          senderName: n.sender?.username,
          senderAvatar: n.sender?.avatar,
          senderId: n.sender?.id,
          createdAt: n.createdAt,
          isRead: n.isRead,
        }));
      }
      return [];
    } catch (error) {
      console.warn('[notificationService] Lỗi khi lấy thông báo từ server:', error);
      return [];
    }
  },

  /**
   * 2. Đánh dấu 1 thông báo là đã đọc
   */
  markAsRead: async (notificationId: string): Promise<boolean> => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      return true;
    } catch (error) {
      console.warn('[notificationService] Lỗi khi đánh dấu đã đọc:', error);
      return false;
    }
  },

  /**
   * 3. Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: async (): Promise<boolean> => {
    try {
      await apiClient.put('/notifications/read-all');
      return true;
    } catch (error) {
      console.warn('[notificationService] Lỗi khi đánh dấu tất cả đã đọc:', error);
      return false;
    }
  },

  /**
   * 4. Xóa tất cả thông báo
   */
  clearAll: async (): Promise<boolean> => {
    try {
      await apiClient.delete('/notifications/clear-all');
      return true;
    } catch (error) {
      console.warn('[notificationService] Lỗi khi xoá toàn bộ thông báo:', error);
      return false;
    }
  },
};

