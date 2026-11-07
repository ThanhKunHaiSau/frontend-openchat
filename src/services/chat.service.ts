import { apiClient } from './apiClient';
import type {
  IChatConversation,
  IGetMessagesResponse,
} from '../interfaces';

export const chatService = {
  /**
   * 1. Lấy danh sách tất cả cuộc trò chuyện của user
   * GET /conversations
   */
  getConversations: async (): Promise<IChatConversation[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: IChatConversation[] }>(
        '/conversations'
      );
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('[chatService] Lỗi khi lấy danh sách cuộc trò chuyện:', error);
      return [];
    }
  },

  /**
   * 2. Khởi tạo hoặc lấy cuộc trò chuyện 1-1 với một người bạn
   * POST /conversations
   * Body: { targetUserId: string }
   */
  getOrCreateConversation: async (targetUserId: string): Promise<IChatConversation | null> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: IChatConversation }>(
        '/conversations',
        { targetUserId }
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[chatService] Lỗi khi tạo/lấy cuộc trò chuyện:', error);
      return null;
    }
  },

  /**
   * 3. Lấy lịch sử tin nhắn của một cuộc trò chuyện
   * GET /conversations/:conversationId/messages?page=1&limit=20
   */
  getMessages: async (
    conversationId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<IGetMessagesResponse> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: IGetMessagesResponse }>(
        `/conversations/${conversationId}/messages`,
        {
          params: { page, limit },
        }
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      return { messages: [], total: 0, page: 1, limit: 20, totalPage: 1 };
    } catch (error) {
      console.error('[chatService] Lỗi khi lấy tin nhắn:', error);
      return { messages: [], total: 0, page: 1, limit: 20, totalPage: 1 };
    }
  },

  /**
   * 4. Upload ảnh gửi trong cuộc trò chuyện
   * POST /messages/upload-image
   */
  uploadImage: async (conversationId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);

      const response = await apiClient.post<{ success: boolean; data: any }>(
        '/messages/upload-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[chatService] Lỗi khi upload ảnh:', error);
      throw error;
    }
  },

  /**
   * 5. Tạo nhóm trò chuyện mới
   * POST /conversations/create-group
   */
  createGroup: async (
    memberIds: string[],
    name?: string
  ): Promise<IChatConversation | null> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: IChatConversation }>(
        '/conversations/create-group',
        { memberIds, name }
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[chatService] Lỗi khi tạo nhóm trò chuyện:', error);
      throw error;
    }
  },

  /**
   * 6. Cập nhật thông tin cuộc trò chuyện (tên, avatar, theme, background, memberIds)
   * PUT /conversations/:conversationId
   */
  updateConversation: async (
    conversationId: string,
    data: {
      name?: string;
      avatar?: string;
      theme?: string | null;
      background?: {
        url?: string | null;
        gradient?: string | null;
      };
      memberIds?: string[];
    }
  ): Promise<IChatConversation | null> => {
    try {
      const response = await apiClient.put<{ success: boolean; data: IChatConversation }>(
        `/conversations/${conversationId}`,
        data
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[chatService] Lỗi khi cập nhật cuộc trò chuyện:', error);
      throw error;
    }
  },

  /**
   * 7. Cập nhật ảnh đại diện nhóm
   * PUT /conversations/:conversationId/avatar
   */
  updateGroupAvatar: async (
    conversationId: string,
    file: File
  ): Promise<IChatConversation | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.put<{ success: boolean; data: IChatConversation }>(
        `/conversations/${conversationId}/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[chatService] Lỗi khi upload ảnh nhóm:', error);
      throw error;
    }
  },

  /**
   * 8. Cập nhật ảnh nền (wallpaper) cuộc trò chuyện
   * PUT /conversations/:conversationId/background
   */
  updateConversationBackground: async (
    conversationId: string,
    file: File
  ): Promise<IChatConversation | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.put<{ success: boolean; data: IChatConversation }>(
        `/conversations/${conversationId}/background`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('[chatService] Lỗi khi upload hình nền:', error);
      throw error;
    }
  },
};

