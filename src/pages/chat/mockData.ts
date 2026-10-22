export interface IMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name?: string;
    size?: string;
  };
  reactions?: { emoji: string; count: number }[];
}

export interface IConversation {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  isOnline: boolean;
  lastSeen?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  role?: string;
  messages: IMessage[];
}

export const INITIAL_CONVERSATIONS: IConversation[] = [
  {
    id: 'conv-1',
    name: 'Phương Linh (UI/UX Designer)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    isOnline: true,
    lastMessage: 'Mình vừa cập nhật bản Figma mới, bạn xem thử nhé! 🎨',
    lastMessageTime: '10:42',
    unreadCount: 2,
    role: 'Product Designer',
    messages: [
      {
        id: 'm-1',
        senderId: 'conv-1',
        senderName: 'Phương Linh',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        content: 'Chào bạn! Dự án OpenChat giao diện Dark Mode nhìn xịn xò quá ✨',
        timestamp: '10:35',
        isMe: false,
      },
      {
        id: 'm-2',
        senderId: 'me',
        senderName: 'Bạn',
        content: 'Cảm ơn Linh nha, đang hoàn thiện phần real-time chat và auth token!',
        timestamp: '10:38',
        isMe: true,
        status: 'read',
      },
      {
        id: 'm-3',
        senderId: 'conv-1',
        senderName: 'Phương Linh',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        content: 'Mình vừa cập nhật bản Figma mới, bạn xem thử nhé! 🎨',
        timestamp: '10:42',
        isMe: false,
        attachment: {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          name: 'OpenChat_Dark_Theme_V2.png',
        },
        reactions: [{ emoji: '🔥', count: 3 }],
      },
    ],
  },
  {
    id: 'conv-2',
    name: '🚀 Team OpenChat Engineering',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    isGroup: true,
    isOnline: true,
    lastMessage: 'Đã test xong Redis cache và Socket.IO cluster, mượt lắm!',
    lastMessageTime: '09:15',
    unreadCount: 0,
    messages: [
      {
        id: 'm-201',
        senderId: 'dev-1',
        senderName: 'Hoàng Nam (Tech Lead)',
        content: 'Mọi người chuẩn bị cho buổi demo Socket.IO hôm nay nhé.',
        timestamp: '09:00',
        isMe: false,
      },
      {
        id: 'm-202',
        senderId: 'dev-2',
        senderName: 'Tuấn Anh',
        content: 'Đã test xong Redis cache và Socket.IO cluster, mượt lắm!',
        timestamp: '09:15',
        isMe: false,
      },
    ],
  },
  {
    id: 'conv-3',
    name: 'Minh Quang',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    isOnline: false,
    lastSeen: '15 phút trước',
    lastMessage: 'Tối nay 8h họp review sprint được không ông?',
    lastMessageTime: 'Hôm qua',
    unreadCount: 0,
    messages: [
      {
        id: 'm-301',
        senderId: 'conv-3',
        senderName: 'Minh Quang',
        content: 'Tối nay 8h họp review sprint được không ông?',
        timestamp: 'Hôm qua',
        isMe: false,
      },
      {
        id: 'm-302',
        senderId: 'me',
        senderName: 'Bạn',
        content: 'Oki ông ơi, hẹn gặp lúc 8h trên Google Meet!',
        timestamp: 'Hôm qua',
        isMe: true,
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-4',
    name: 'Thảo My',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    isOnline: true,
    lastMessage: 'Oke nhé! File báo cáo mình đã đính kèm rồi.',
    lastMessageTime: 'Thứ 3',
    unreadCount: 0,
    messages: [
      {
        id: 'm-401',
        senderId: 'conv-4',
        senderName: 'Thảo My',
        content: 'Oke nhé! File báo cáo mình đã đính kèm rồi.',
        timestamp: 'Thứ 3',
        isMe: false,
      },
    ],
  },
  {
    id: 'conv-5',
    name: 'Bảo Long (DevOps)',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    isGroup: false,
    isOnline: false,
    lastSeen: '1 giờ trước',
    lastMessage: 'Đã cấu hình xong Nginx Reverse Proxy và SSL',
    lastMessageTime: 'Thứ 2',
    unreadCount: 0,
    messages: [
      {
        id: 'm-501',
        senderId: 'conv-5',
        senderName: 'Bảo Long',
        content: 'Đã cấu hình xong Nginx Reverse Proxy và SSL',
        timestamp: 'Thứ 2',
        isMe: false,
      },
    ],
  },
];
