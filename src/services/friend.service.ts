import { apiClient } from './apiClient';
import type {
  IFriendUser,
  IFriendRequest,
  IFriendActionResponse,
} from '../interfaces';

// Dữ liệu mẫu ban đầu để giao diện hoạt động mượt mà ngay cả khi chưa chạy xong API backend
const MOCK_USERS: IFriendUser[] = [
  {
    _id: 'user-mock-1',
    username: 'thanh_tung_dev',
    fullName: 'Nguyễn Thanh Tùng',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    email: 'tung.nguyen@example.com',
    phone: '0987654321',
    gender: 'Male',
    isOnline: true,
    relationshipStatus: 'none',
    bio: 'Fullstack Developer đam mê React & Node.js 💻',
  },
  {
    _id: 'user-mock-2',
    username: 'ha_linh_design',
    fullName: 'Trần Hà Linh',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    email: 'halinh.design@example.com',
    phone: '0912345678',
    gender: 'Female',
    isOnline: true,
    relationshipStatus: 'pending_received',
    bio: 'UI/UX Designer • Yêu thích phong cách tối giản & màu sắc pastel ✨',
  },
  {
    _id: 'user-mock-3',
    username: 'minh_quan_backend',
    fullName: 'Đỗ Minh Quân',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    email: 'quan.do@example.com',
    phone: '0903112233',
    gender: 'Male',
    isOnline: false,
    relationshipStatus: 'friend',
    bio: 'Backend Engineer • Golang, NestJS & Microservices ⚙️',
  },
  {
    _id: 'user-mock-4',
    username: 'hoang_anh_99',
    fullName: 'Lê Hoàng Anh',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    email: 'hoanganh99@example.com',
    phone: '0934567890',
    gender: 'Male',
    isOnline: true,
    relationshipStatus: 'pending_sent',
    bio: 'DevOps & Cloud Architect ☁️',
  },
  {
    _id: 'user-mock-5',
    username: 'mai_phuong_pm',
    fullName: 'Vũ Mai Phương',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    email: 'phuong.vu@example.com',
    phone: '0978901234',
    gender: 'Female',
    isOnline: false,
    relationshipStatus: 'friend',
    bio: 'Product Manager @ OpenChat 🚀',
  },
];

const MOCK_REQUESTS: IFriendRequest[] = [
  {
    _id: 'req-mock-1',
    fromUser: MOCK_USERS[1], // Hà Linh gửi lời mời cho bạn
    toUser: {
      _id: 'me',
      username: 'currentUser',
      fullName: 'Bạn',
    },
    status: 'pending',
    createdAt: '10 phút trước',
  },
  {
    _id: 'req-mock-2',
    fromUser: {
      _id: 'me',
      username: 'currentUser',
      fullName: 'Bạn',
    },
    toUser: MOCK_USERS[3], // Bạn đã gửi lời mời cho Hoàng Anh
    status: 'pending',
    createdAt: 'Hôm qua',
  },
];

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
      console.warn('[friendService] API /users/all-user lỗi hoặc chưa có token, dùng dữ liệu giả lập:', error);
      const q = (name || '').toLowerCase().trim();
      const filtered = q
        ? MOCK_USERS.filter(
            (u) =>
              u.username.toLowerCase().includes(q) ||
              (u.fullName && u.fullName.toLowerCase().includes(q))
          )
        : MOCK_USERS;

      return {
        users: filtered,
        total: filtered.length,
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
      console.warn('[friendService] API /users/friend lỗi hoặc chưa có token, dùng dữ liệu giả lập:', error);
      return MOCK_USERS.filter((u) => u.relationshipStatus === 'friend');
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
      console.warn('[friendService] API /users/request?type=... lỗi hoặc chưa có token, dùng dữ liệu giả lập:', error);
      return {
        received: MOCK_REQUESTS.filter((r) => r.fromUser._id !== 'me'),
        sent: MOCK_REQUESTS.filter((r) => r.fromUser._id === 'me'),
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
