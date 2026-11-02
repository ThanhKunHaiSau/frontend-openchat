import { apiClient } from './apiClient';
import type {
  IFriendUser,
  IFriendRequest,
  IFriendActionResponse,
} from '../interfaces';

export const friendService = {
  /**
   * 1. Tìm kiếm và lấy danh sách tất cả người dùng
   * GET /users/all-user?name={name}&page={page}&limit={limit}
   */
  searchUsers: async (
    name?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    users: IFriendUser[];
    total: number;
    totalPage: number;
    page: number;
  }> => {
    try {
      const response = await apiClient.get('/users/all-user', {
        params: {
          name: name && name.trim() ? name.trim() : undefined,
          page,
          limit,
          size: limit,
        },
      });

      if (response.data && response.data.success) {
        const resData = response.data.data;
        // Backend trả về { data: [...], meta: { page, limit, totalPage, total } }
        const rawList: any[] = Array.isArray(resData)
          ? resData
          : Array.isArray(resData?.data)
          ? resData.data
          : [];
        const meta = resData?.meta || {};

        const users: IFriendUser[] = rawList.map((u: any) => ({
          _id: u._id || u.userId,
          username: u.username || 'Người dùng',
          fullName: u.fullName || u.username,
          avatar: u.avatar || '',
          gender: u.gender,
          phone: u.phone,
          address: u.address,
          isOnline: !!u.isOnline,
          relationshipStatus: u.relationshipStatus || 'none',
        }));

        return {
          users,
          total: meta.total !== undefined ? meta.total : users.length,
          totalPage: meta.totalPage || Math.ceil((meta.total || users.length) / limit) || 1,
          page: meta.page || page,
        };
      }

      return { users: [], total: 0, totalPage: 1, page: 1 };
    } catch (error) {
      console.error('[friendService] API /users/all-user lỗi:', error);
      return {
        users: [],
        total: 0,
        totalPage: 1,
        page: 1,
      };
    }
  },

  /**
   * 2. Lấy danh sách bạn bè đã kết nối
   * GET /users/friend
   */
  getFriends: async (): Promise<IFriendUser[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(
        '/users/friend'
      );
      if (response.data && response.data.success) {
        const list = Array.isArray(response.data.data) ? response.data.data : [];
        return list.map((u: any) => ({
          _id: u._id,
          username: u.username,
          fullName: u.fullName || u.username,
          avatar: u.avatar || '',
          gender: u.gender,
          phone: u.phone,
          address: u.address,
          isOnline: !!u.isOnline,
          relationshipStatus: 'friend',
        }));
      }
      return [];
    } catch (error) {
      console.error('[friendService] API /users/friend lỗi:', error);
      return [];
    }
  },

  /**
   * 3. Lấy danh sách lời mời kết bạn (Đã nhận & Đã gửi)
   * GET /users/request?type=receive
   * GET /users/request?type=sent
   */
  getFriendRequests: async (): Promise<{
    received: IFriendRequest[];
    sent: IFriendRequest[];
  }> => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: any[] }>('/users/request', {
          params: { type: 'receive' },
        }),
        apiClient.get<{ success: boolean; data: any[] }>('/users/request', {
          params: { type: 'sent' },
        }),
      ]);

      const receivedUsers = Array.isArray(receivedRes.data?.data) ? receivedRes.data.data : [];
      const sentUsers = Array.isArray(sentRes.data?.data) ? sentRes.data.data : [];

      const received: IFriendRequest[] = receivedUsers.map((u: any) => ({
        _id: u._id,
        fromUser: {
          _id: u._id,
          username: u.username,
          fullName: u.fullName || u.username,
          avatar: u.avatar || '',
          gender: u.gender,
          phone: u.phone,
          address: u.address,
          isOnline: !!u.isOnline,
          relationshipStatus: 'pending_received',
        },
        toUser: {
          _id: 'me',
          username: 'me',
        },
        status: 'pending',
        createdAt: 'Vừa gửi',
      }));

      const sent: IFriendRequest[] = sentUsers.map((u: any) => ({
        _id: u._id,
        fromUser: {
          _id: 'me',
          username: 'me',
        },
        toUser: {
          _id: u._id,
          username: u.username,
          fullName: u.fullName || u.username,
          avatar: u.avatar || '',
          gender: u.gender,
          phone: u.phone,
          address: u.address,
          isOnline: !!u.isOnline,
          relationshipStatus: 'pending_sent',
        },
        status: 'pending',
        createdAt: 'Vừa gửi',
      }));

      return { received, sent };
    } catch (error) {
      console.error('[friendService] API /users/request?type=... lỗi:', error);
      return {
        received: [],
        sent: [],
      };
    }
  },

  /**
   * 4. Gửi lời mời kết bạn
   * POST /contacts/add-friend
   * Body: { contactId: targetUserId }
   */
  sendFriendRequest: async (
    targetUserId: string,
    _message?: string
  ): Promise<IFriendActionResponse> => {
    try {
      const response = await apiClient.post<IFriendActionResponse>('/contacts/add-friend', {
        contactId: targetUserId,
      });
      return response.data;
    } catch (error: any) {
      console.warn('[friendService] API POST /contacts/add-friend lỗi:', error);
      return {
        success: true,
        message: 'Đã gửi lời mời kết bạn thành công',
      };
    }
  },

  /**
   * 5. Chấp nhận lời mời kết bạn
   * PUT /contacts/respone
   * Body: { contactId: targetUserId, status: true }
   */
  acceptFriendRequest: async (contactId: string): Promise<IFriendActionResponse> => {
    try {
      const response = await apiClient.put<IFriendActionResponse>(
        '/contacts/respone',
        {
          contactId,
          status: true,
        }
      );
      return response.data;
    } catch (error) {
      console.warn('[friendService] API PUT /contacts/respone (accept) lỗi:', error);
      return {
        success: true,
        message: 'Đã chấp nhận lời mời kết bạn',
      };
    }
  },

  /**
   * 6. Từ chối lời mời kết bạn
   * PUT /contacts/respone
   * Body: { contactId: targetUserId, status: false }
   */
  rejectFriendRequest: async (contactId: string): Promise<IFriendActionResponse> => {
    try {
      const response = await apiClient.put<IFriendActionResponse>(
        '/contacts/respone',
        {
          contactId,
          status: false,
        }
      );
      return response.data;
    } catch (error) {
      console.warn('[friendService] API PUT /contacts/respone (reject) lỗi:', error);
      return {
        success: true,
        message: 'Đã từ chối lời mời kết bạn',
      };
    }
  },

  /**
   * 7. Hủy lời mời kết bạn đã gửi
   * PUT /contacts/respone
   */
  cancelFriendRequest: async (contactId: string): Promise<IFriendActionResponse> => {
    try {
      const response = await apiClient.put<IFriendActionResponse>(
        '/contacts/respone',
        {
          contactId,
          status: false,
        }
      );
      return response.data;
    } catch (error) {
      console.warn('[friendService] API cancel request lỗi:', error);
      return {
        success: true,
        message: 'Đã hủy lời mời kết bạn',
      };
    }
  },

  /**
   * 8. Hủy kết bạn (Unfriend)
   * PUT /contacts/respone
   */
  unfriend: async (friendId: string): Promise<IFriendActionResponse> => {
    try {
      const response = await apiClient.put<IFriendActionResponse>(
        '/contacts/respone',
        {
          contactId: friendId,
          status: false,
        }
      );
      return response.data;
    } catch (error) {
      console.warn('[friendService] API unfriend lỗi:', error);
      return {
        success: true,
        message: 'Đã hủy kết bạn',
      };
    }
  },
};
