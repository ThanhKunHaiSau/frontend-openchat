import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth, useSocket, useSocketEvent } from '../../contexts';
import {
  Send,
  Smile,
  Paperclip,
  Image,
  Phone,
  Video,
  Search,
  LogOut,
  Users,
  MessageSquare,
  CheckCheck,
  Check,
  Bell,
  Info,
  ShieldCheck,
  Circle,
  X,
  FileText,
  Settings,
  UserPlus,
  Trash2,
  Loader2,
  Sparkles,
  Camera,
  Palette,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { ProfileModal, FriendModal, CreateGroupModal, Toast, NotificationDropdown, type ToastMessage } from '../../components';
import { friendService, notificationService, chatService } from '../../services';
import type {
  IFriendUser,
  INotificationItem,
  IChatConversation,
  IChatMessage,
  IChatUser,
} from '../../interfaces';
import { playNotificationSound } from '../../utils/sound';
import './ChatPage.css';

// Danh sách Emoji phân loại theo chủ đề
const EMOJI_CATEGORIES = [
  {
    name: 'Phổ biến',
    emojis: ['😀', '😂', '🤣', '😍', '🥰', '😘', '😊', '😭', '🥺', '😎', '🥳', '🤔', '👍', '👎', '👏', '🙌', '🔥', '✨', '🎉', '❤️', '💔', '💯', '💩', '🤝'],
  },
  {
    name: 'Mặt cười & Cảm xúc',
    emojis: [
      '🙂', '😉', '😇', '😋', '😜', '🤪', '🤗', '🤭', '🤫', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '😦', '😧', '😨', '😰', '😥', '😢', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '🤡', '👻', '👽', '🤖'
    ],
  },
  {
    name: 'Bàn tay & Cử chỉ',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '✊', '👊', '🤛', '🤜', '👐', '🤲', '🙏', '✍️', '💅', '🤳', '💪'],
  },
  {
    name: 'Trái tim & Biểu tượng',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  },
];

// Danh sách Sticker hoạt hình động (WebP / GIF chất lượng cao)
const STICKER_LIST = [
  { id: 's1', name: 'Mèo Thả Tim', url: 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif' },
  { id: 's2', name: 'Mèo Nhảy Múa', url: 'https://media.giphy.com/media/BzyTuYCmvSORqs1ABM/giphy.gif' },
  { id: 's3', name: 'Mèo Cười Vui', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
  { id: 's4', name: 'Mèo Khóc', url: 'https://media.giphy.com/media/L95W4wvxxB1G8/giphy.gif' },
  { id: 's5', name: 'Mèo Buồn Ngủ', url: 'https://media.giphy.com/media/mGDiZsA88Re8OHm2Iz/giphy.gif' },
  { id: 's6', name: 'Mèo Hoảng Hốt', url: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif' },
  { id: 's7', name: 'Cún Vẫy Đuôi', url: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/giphy.gif' },
  { id: 's8', name: 'Bắn Tim Cute', url: 'https://media.giphy.com/media/26BRv0ThflsDTjDUs/giphy.gif' },
  { id: 's9', name: 'Like Tuyệt Vời', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 's10', name: 'Ăn Mừng Quẩy', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 's11', name: 'Gấu Cười Khà Khà', url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif' },
  { id: 's12', name: 'Vỗ Tay Khen Ngợi', url: 'https://media.giphy.com/media/nbvFVEldHM4EV6zx3K/giphy.gif' },
];

// Kiểm tra tin nhắn có phải chỉ gồm 1-3 emoji hay không
const isOnlyEmoji = (text: string): boolean => {
  if (!text) return false;
  const clean = text.trim();
  if (clean.length > 12) return false;
  const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s)+$/u;
  return emojiRegex.test(clean);
};

// Danh sách các tùy chọn chủ đề (Theme) màu sắc
const THEME_OPTIONS = [
  { id: 'default', name: 'Tím Indigo (Mặc định)', color: '#6366f1' },
  { id: 'ocean', name: 'Đại dương (Cyan)', color: '#0284c7' },
  { id: 'emerald', name: 'Lục bảo (Emerald)', color: '#059669' },
  { id: 'sunset', name: 'Hoàng hôn (Rose)', color: '#e11d48' },
  { id: 'purple', name: 'Tím Neon (Violet)', color: '#9333ea' },
  { id: 'amber', name: 'Hổ phách (Amber)', color: '#d97706' },
  { id: 'midnight', name: 'Bóng đêm (Midnight)', color: '#374151' },
];

// Danh sách các tùy chọn hình nền gradient (Wallpaper Presets)
const WALLPAPER_PRESETS = [
  { id: 'default-bg', name: 'Mặc định', gradient: '' },
  { id: 'dark-cosmic', name: 'Vũ trụ huyền ảo', gradient: 'radial-gradient(ellipse at top, #1e1b4b, #0b0f19 75%)' },
  { id: 'ocean-depth', name: 'Biển sâu', gradient: 'radial-gradient(ellipse at top, #0c4a6e, #030712 75%)' },
  { id: 'emerald-night', name: 'Đêm ngọc bích', gradient: 'radial-gradient(ellipse at top, #064e3b, #022c22 75%)' },
  { id: 'sunset-glow', name: 'Ánh hoàng hôn', gradient: 'radial-gradient(ellipse at top, #881337, #18181b 75%)' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', gradient: 'linear-gradient(135deg, #311042 0%, #111827 50%, #0d2838 100%)' },
];

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const currentUserId = (user?._id || user?.userId || '').toString();

  // Navigation tab: 'chats' hoặc 'friends'
  const [activeNavTab, setActiveNavTab] = useState<'chats' | 'friends'>('chats');

  // Real Conversations State
  const [conversations, setConversations] = useState<IChatConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string>('');

  // Real Messages State
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Online Tracking
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Typing state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Emoji & Sticker Picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emoji' | 'sticker'>('emoji');
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  // Upload image state
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Filter & Search
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Group Avatar & Rename states
  const [isUploadingGroupAvatar, setIsUploadingGroupAvatar] = useState(false);
  const groupAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Wallpaper Background Upload states
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  // Real Friends state
  const [friends, setFriends] = useState<IFriendUser[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendFilterTab, setFriendFilterTab] = useState<'all' | 'online'>('all');

  // Profile, Friend, Group modals and toast state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [pendingReqCount, setPendingReqCount] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Notification panel state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem('openchat_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Lưu thông báo vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('openchat_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Không thể lưu notifications vào localStorage', e);
    }
  }, [notifications]);

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    notificationService.markAllAsRead();
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    notificationService.clearAll();
  };

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Lấy thông báo ban đầu và số lượng lời mời kết bạn
  useEffect(() => {
    notificationService.getNotifications().then((list) => {
      if (list && list.length > 0) {
        setNotifications(list);
      }
    });

    friendService
      .getFriendRequests()
      .then((res) => {
        if (res?.received) {
          setPendingReqCount(res.received.length);
        }
      })
      .catch(() => { });
  }, []);

  // Helpers trích xuất thông tin người trò chuyện đối diện
  const getOtherParticipant = useCallback(
    (conv: IChatConversation): IChatUser | undefined => {
      if (!conv?.participants || conv.participants.length === 0) return undefined;
      return (
        conv.participants.find(
          (p) => (p._id || (p as any).id || '').toString() !== currentUserId
        ) || conv.participants[0]
      );
    },
    [currentUserId]
  );

  const getConvName = useCallback(
    (conv: IChatConversation): string => {
      if (conv.type === 'group') return conv.name || 'Nhóm trò chuyện';
      const other = getOtherParticipant(conv);
      return other?.fullName || other?.username || 'Người dùng';
    },
    [getOtherParticipant]
  );

  const getConvAvatar = useCallback(
    (conv: IChatConversation): string => {
      if (conv.type === 'group') {
        return (
          conv.avatar ||
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80'
        );
      }
      const other = getOtherParticipant(conv);
      return (
        other?.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      );
    },
    [getOtherParticipant]
  );

  const getConvIsOnline = useCallback(
    (conv: IChatConversation): boolean => {
      if (conv.type === 'group') return false;
      const other = getOtherParticipant(conv);
      if (!other?._id) return false;
      return onlineUserIds.has(other._id) || !!other.isOnline;
    },
    [getOtherParticipant, onlineUserIds]
  );

  const getConvLastMessage = useCallback(
    (conv: IChatConversation): string => {
      if (!conv.lastMessage?.content) return 'Bắt đầu cuộc trò chuyện 👋';
      const sId =
        typeof conv.lastMessage.senderId === 'object'
          ? (conv.lastMessage.senderId as any)?._id?.toString()
          : conv.lastMessage.senderId?.toString();
      const isMe = sId === currentUserId;
      return isMe ? `Bạn: ${conv.lastMessage.content}` : conv.lastMessage.content;
    },
    [currentUserId]
  );

  const getConvLastMessageTime = (conv: IChatConversation): string => {
    const dateStr = conv.lastMessage?.createdAt || conv.updatedAt;
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const getConvUnreadCount = useCallback(
    (conv: IChatConversation): number => {
      if (!conv.unreadCounts) return 0;
      if (typeof (conv.unreadCounts as any).get === 'function') {
        return (conv.unreadCounts as any).get(currentUserId) || 0;
      }
      return (conv.unreadCounts as Record<string, number>)[currentUserId] || 0;
    },
    [currentUserId]
  );

  // Tải danh sách hội thoại từ Backend
  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const convs = await chatService.getConversations();
      setConversations(convs);
      setActiveConvId((curr) => {
        if (curr && convs.some((c) => c._id === curr)) return curr;
        return convs.length > 0 ? convs[0]._id : '';
      });
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Tải danh sách bạn bè thật từ Backend
  const loadFriendsData = useCallback(async () => {
    try {
      setIsLoadingFriends(true);
      const data = await friendService.getFriends();
      setFriends(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách bạn bè:', err);
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  // Khởi động dữ liệu ban đầu
  useEffect(() => {
    if (currentUserId) {
      loadConversations();
      loadFriendsData();
    }
  }, [currentUserId, loadConversations, loadFriendsData]);

  // Cuộc trò chuyện đang chọn
  const activeConv = conversations.find((c) => c._id === activeConvId);

  // Tính toán vị trí hiển thị avatar "Đã xem" (Avatar chỉ xuất hiện ở tin nhắn mới nhất mỗi thành viên đã đọc)
  const lastReadMap = useMemo(() => {
    const result = new Map<string, IChatUser[]>();
    if (!activeConv || !activeConv.participants || messages.length === 0) {
      return result;
    }

    // Danh sách thành viên khác ngoài bản thân
    const otherParticipants = activeConv.participants.filter(
      (p) => p._id && p._id.toString() !== currentUserId
    );

    otherParticipants.forEach((participant) => {
      const pId = participant._id.toString();

      // Duyệt ngược từ tin nhắn mới nhất đến cũ nhất
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const senderId = (msg.senderId?._id || (msg.senderId as any))?.toString();

        const hasRead = msg.readBy?.some((r) => {
          const rId = typeof r.userId === 'object' ? (r.userId as any)?._id : r.userId;
          return rId?.toString() === pId;
        });

        // Nếu participant này gửi tin nhắn này, hoặc đã được ghi nhận đọc tin nhắn này
        if (hasRead || senderId === pId) {
          const list = result.get(msg._id) || [];
          list.push(participant);
          result.set(msg._id, list);
          break; // Chỉ gắn user vào tin nhắn mới nhất họ đã đọc!
        }
      }
    });

    return result;
  }, [messages, activeConv, currentUserId]);

  // Khi activeConvId thay đổi: Tham gia room socket, tải tin nhắn và đánh dấu đã đọc
  useEffect(() => {
    if (!activeConvId || !socket) {
      setMessages([]);
      return;
    }

    // 1. Tham gia room socket của hội thoại
    socket.emit('join_conversation', { conversationId: activeConvId });

    // 2. Tải lịch sử tin nhắn từ database
    setIsLoadingMessages(true);
    chatService
      .getMessages(activeConvId, 1, 50)
      .then((res) => {
        setMessages(res.messages || []);
        setIsLoadingMessages(false);
      })
      .catch((err) => {
        console.error('Lỗi khi tải tin nhắn:', err);
        setIsLoadingMessages(false);
      });

    // 3. Đánh dấu đã đọc qua socket
    socket.emit('mark_read', { conversationId: activeConvId });

    // 4. Xóa số tin chưa đọc trên giao diện
    setConversations((prev) =>
      prev.map((c) => {
        if (c._id === activeConvId) {
          return {
            ...c,
            unreadCounts: {
              ...(c.unreadCounts || {}),
              [currentUserId]: 0,
            },
          };
        }
        return c;
      })
    );

    // 5. Rời room khi đổi hội thoại khác hoặc unmount
    return () => {
      socket.emit('leave_conversation', { conversationId: activeConvId });
      setIsOtherTyping(false);
    };
  }, [activeConvId, socket, currentUserId]);

  // Auto-scroll to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, isOtherTyping]);

  // Lắng nghe sự kiện nhận tin nhắn Realtime
  useSocketEvent('receive_message', (msg: IChatMessage) => {
    console.log('⚡ [Socket] Nhận tin nhắn mới:', msg);
    const senderId = (msg.senderId?._id || (msg.senderId as any))?.toString();
    const isFromMe = senderId === currentUserId;

    // 1. Nếu tin nhắn thuộc cuộc trò chuyện đang mở
    if (msg.conversationId === activeConvId) {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // Nếu nhận tin từ người khác khi đang trong phòng -> đánh dấu đã đọc ngay
      if (!isFromMe) {
        socket.emit('mark_read', { conversationId: activeConvId });
      }
    } else {
      // Tin nhắn đến từ cuộc trò chuyện khác -> phát chuông & hiển thị toast
      if (!isFromMe) {
        playNotificationSound();
        const senderName = msg.senderId?.username || 'Bạn bè';
        addToast('info', `Tin nhắn từ ${senderName}`, msg.content);
      }
    }

    // 2. Cập nhật preview lastMessage và đưa cuộc trò chuyện lên đầu danh sách
    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c._id === msg.conversationId);
      if (existingIndex === -1) {
        loadConversations();
        return prev;
      }

      const existing = prev[existingIndex];
      const isCurrentlyActive = existing._id === activeConvId;
      const currentUnread = getConvUnreadCount(existing);

      const updated: IChatConversation = {
        ...existing,
        lastMessage: {
          messageId: msg._id,
          senderId: msg.senderId,
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt,
        },
        updatedAt: msg.createdAt,
        unreadCounts: {
          ...(existing.unreadCounts || {}),
          [currentUserId]: isCurrentlyActive || isFromMe ? 0 : currentUnread + 1,
        },
      };

      const remaining = prev.filter((c) => c._id !== msg.conversationId);
      return [updated, ...remaining];
    });
  });

  // Lắng nghe cập nhật cuộc trò chuyện Realtime (khi có tin nhắn mới hoặc thay đổi)
  useSocketEvent('conversation_updated', (updatedConv: IChatConversation) => {
    console.log('⚡ [Socket] Hội thoại được cập nhật:', updatedConv);
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === updatedConv._id);
      if (!exists) {
        return [updatedConv, ...prev];
      }
      return [updatedConv, ...prev.filter((c) => c._id !== updatedConv._id)];
    });
  });

  // Lắng nghe chỉ báo đang gõ (Typing Indicator)
  useSocketEvent(
    'user_typing',
    (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === activeConvId && data.userId !== currentUserId) {
        setIsOtherTyping(data.isTyping);
      }
    }
  );

  // Lắng nghe khi đối phương hoặc thành viên nhóm đã đọc tin nhắn
  useSocketEvent(
    'messages_read',
    (data: {
      conversationId: string;
      userId: string;
      reader?: IChatUser;
      readAt?: string;
    }) => {
      if (data.conversationId === activeConvId && data.userId !== currentUserId) {
        const readerUser: IChatUser =
          data.reader ||
          activeConv?.participants?.find((p) => p._id === data.userId) || {
            _id: data.userId,
            username: 'Thành viên',
          };

        setMessages((prev) =>
          prev.map((m) => {
            const mSenderId = (m.senderId?._id || (m.senderId as any))?.toString();
            const isMyMsg = mSenderId === currentUserId;

            // Kiểm tra xem user này đã có trong readBy của tin nhắn chưa
            const alreadyInReadBy = m.readBy?.some((r) => {
              const rId = typeof r.userId === 'object' ? (r.userId as any)?._id : r.userId;
              return rId?.toString() === data.userId.toString();
            });

            // Nếu người đọc không phải người gửi tin nhắn này và chưa có trong readBy
            if (mSenderId !== data.userId && !alreadyInReadBy) {
              const updatedReadBy = [
                ...(m.readBy || []),
                {
                  userId: readerUser,
                  readAt: data.readAt || new Date().toISOString(),
                },
              ];
              return {
                ...m,
                status: isMyMsg ? 'read' : m.status,
                readBy: updatedReadBy,
              };
            }

            if (isMyMsg && m.status !== 'read') {
              return { ...m, status: 'read' };
            }

            return m;
          })
        );
      }
    }
  );

  // Lắng nghe sự kiện bạn bè thay đổi trạng thái Online/Offline Realtime
  useSocketEvent('user_status_change', (data: { userId: string; isOnline: boolean }) => {
    console.log('⚡ [Socket] Trạng thái online của bạn bè thay đổi:', data);
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      if (data.isOnline) next.add(data.userId);
      else next.delete(data.userId);
      return next;
    });
    setFriends((prev) =>
      prev.map((f) => (f._id === data.userId ? { ...f, isOnline: data.isOnline } : f))
    );
  });

  // Lắng nghe danh sách bạn bè đang online ban đầu từ Server
  useSocketEvent('online_friends_list', (onlineIds: string[]) => {
    console.log('⚡ [Socket] Danh sách bạn bè đang online:', onlineIds);
    setOnlineUserIds(new Set(onlineIds));
    setFriends((prev) =>
      prev.map((f) => ({ ...f, isOnline: onlineIds.includes(f._id) }))
    );
  });

  // Lắng nghe lời mời kết bạn mới Realtime
  useSocketEvent('res_add_contact', (data: any) => {
    console.log('⚡ [Socket] Nhận lời mời kết bạn:', data);
    const senderName = data?.userCurent?.username || 'Một người dùng';
    const message = data?.message || `${senderName} vừa gửi cho bạn một lời mời kết bạn!`;

    playNotificationSound();

    const newNotif: INotificationItem = {
      id: `notif-${Date.now()}-${Math.random()}`,
      title: 'Lời mời kết bạn mới',
      message,
      type: 'friend_request',
      senderName,
      senderAvatar: data?.userCurent?.avatar,
      senderId: data?.userCurent?.id,
      createdAt: data?.createdAt || new Date().toISOString(),
      isRead: false,
      data,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addToast('info', 'Lời mời kết bạn mới 👋', message);
    setPendingReqCount((prev) => prev + 1);
  });

  // Lắng nghe đối phương huỷ lời mời kết bạn Realtime
  useSocketEvent('res_cancel_contact', (data: any) => {
    console.log('⚡ [Socket] Đối phương đã huỷ lời mời kết bạn:', data);
    setPendingReqCount((prev) => Math.max(0, prev - 1));

    const senderName = data?.username || 'Đối phương';
    const newNotif: INotificationItem = {
      id: `notif-${Date.now()}-${Math.random()}`,
      title: 'Huỷ lời mời kết bạn',
      message: `${senderName} đã huỷ lời mời kết bạn gửi đến bạn.`,
      type: 'system',
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  });

  // Lắng nghe đối phương chấp nhận kết bạn Realtime
  useSocketEvent('res_accept_contact', (data: any) => {
    console.log('⚡ [Socket] Đối phương đã chấp nhận kết bạn:', data);
    const senderName = data?.userCurent?.username || 'Đối phương';
    const message = data?.message || `${senderName} đã chấp nhận lời mời kết bạn!`;

    playNotificationSound();

    const newNotif: INotificationItem = {
      id: data?.id || `notif-${Date.now()}-${Math.random()}`,
      title: 'Kết bạn thành công 🎉',
      message,
      type: 'friend_request',
      senderName,
      senderAvatar: data?.userCurent?.avatar,
      senderId: data?.userCurent?.id,
      createdAt: data?.createdAt || new Date().toISOString(),
      isRead: false,
      data,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addToast('success', 'Kết bạn thành công 🎉', message);
    loadFriendsData();
    loadConversations();
  });

  // Lắng nghe sự kiện được thêm vào nhóm chat Realtime
  useSocketEvent('res_add_group', (data: any) => {
    console.log('⚡ [Socket] Nhận thông báo được thêm vào nhóm chat:', data);
    const senderName = data?.sender?.username || 'Bạn bè';
    const message = data?.message || `Bạn đã được ${senderName} thêm vào nhóm chat mới!`;

    // 1. Phát chuông thông báo
    playNotificationSound();

    // 2. Thêm vào chuông thông báo
    const newNotif: INotificationItem = {
      id: data?.id || `notif-${Date.now()}-${Math.random()}`,
      title: 'Nhóm trò chuyện mới 👥',
      message,
      type: 'group',
      senderName,
      senderAvatar: data?.sender?.avatar,
      senderId: data?.sender?.id,
      createdAt: data?.createdAt || new Date().toISOString(),
      isRead: false,
      data,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // 3. Hiển thị Toast thông báo
    addToast('info', 'Nhóm trò chuyện mới 👥', message);

    // 4. Tự động chèn nhóm mới vào danh sách hội thoại bên trái
    if (data?.conversation) {
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === data.conversationId);
        if (exists) return prev;
        return [data.conversation, ...prev];
      });
    } else {
      loadConversations();
    }
  });

  // Gõ tin nhắn và phát typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    if (!activeConvId || !socket) return;

    socket.emit('typing_start', { conversationId: activeConvId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId: activeConvId });
    }, 2000);
  };

  // Gửi tin nhắn
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConvId || !inputText.trim() || !socket) return;

    const sentText = inputText.trim();
    setInputText('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socket.emit('typing_stop', { conversationId: activeConvId });

    // Gửi tin nhắn qua Socket
    socket.emit('send_message', {
      conversationId: activeConvId,
      content: sentText,
      type: 'text',
    });
  };

  // Xử lý gửi hình ảnh đính kèm
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;

    // Reset input để người dùng có thể gửi lại cùng 1 file nếu muốn
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Lỗi file', 'Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WebP...)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'File quá lớn', 'Kích thước ảnh tối đa là 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      addToast('info', 'Đang tải ảnh...', 'Đang upload ảnh lên hệ thống...');
      const newMsg = await chatService.uploadImage(activeConvId, file);
      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }
      addToast('success', 'Gửi ảnh thành công', 'Hình ảnh đã được gửi thành công!');
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh:', err);
      addToast('error', 'Lỗi tải ảnh', err.response?.data?.message || err.message || 'Không thể gửi ảnh');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 1. Cập nhật ảnh đại diện nhóm (Group Avatar)
  const handleGroupAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Lỗi tệp tin', 'Chỉ chấp nhận file hình ảnh (JPG, PNG, WebP...)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'Ảnh quá lớn', 'Kích thước ảnh avatar nhóm tối đa là 5MB');
      return;
    }

    try {
      setIsUploadingGroupAvatar(true);
      addToast('info', 'Đang cập nhật avatar nhóm...', 'Hệ thống đang tải và xử lý ảnh đại diện nhóm');
      const updated = await chatService.updateGroupAvatar(activeConv._id, file);
      if (updated) {
        setConversations((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        addToast('success', 'Thành công', 'Đã cập nhật ảnh đại diện nhóm!');
      }
    } catch (err: any) {
      console.error('Lỗi khi đổi avatar nhóm:', err);
      addToast('error', 'Lỗi cập nhật', err.response?.data?.message || err.message || 'Không thể đổi avatar nhóm');
    } finally {
      setIsUploadingGroupAvatar(false);
    }
  };

  // 2. Chỉnh sửa tên nhóm
  const handleStartEditGroupName = () => {
    if (!activeConv) return;
    setNewGroupName(activeConv.name || '');
    setIsEditingGroupName(true);
  };

  const handleSaveGroupName = async () => {
    if (!activeConv || !newGroupName.trim()) {
      setIsEditingGroupName(false);
      return;
    }
    if (newGroupName.trim() === activeConv.name) {
      setIsEditingGroupName(false);
      return;
    }
    try {
      const updated = await chatService.updateConversation(activeConv._id, {
        name: newGroupName.trim(),
      });
      if (updated) {
        setConversations((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        addToast('success', 'Thành công', 'Đổi tên nhóm thành công!');
      }
    } catch (err: any) {
      console.error('Lỗi khi đổi tên nhóm:', err);
      addToast('error', 'Lỗi cập nhật', err.response?.data?.message || err.message || 'Không thể đổi tên nhóm');
    } finally {
      setIsEditingGroupName(false);
    }
  };

  // 3. Chọn chủ đề màu sắc (Theme)
  const handleSelectTheme = async (themeId: string) => {
    if (!activeConv) return;
    try {
      const updated = await chatService.updateConversation(activeConv._id, {
        theme: themeId,
      });
      if (updated) {
        setConversations((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        addToast('success', 'Đổi chủ đề thành công', 'Chủ đề tin nhắn đã được cập nhật');
      }
    } catch (err: any) {
      console.error('Lỗi đổi theme:', err);
      addToast('error', 'Lỗi cập nhật', err.response?.data?.message || err.message || 'Không thể đổi chủ đề');
    }
  };

  // 4. Chọn hình nền gradient preset
  const handleSelectGradient = async (gradient: string) => {
    if (!activeConv) return;
    try {
      const updated = await chatService.updateConversation(activeConv._id, {
        background: {
          url: null, // Xóa ảnh custom nếu chọn gradient preset
          gradient: gradient || null,
        },
      });
      if (updated) {
        setConversations((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        addToast('success', 'Đổi hình nền', 'Đã cập nhật hình nền cuộc trò chuyện');
      }
    } catch (err: any) {
      console.error('Lỗi đổi gradient nền:', err);
      addToast('error', 'Lỗi cập nhật', err.response?.data?.message || err.message || 'Không thể đổi hình nền');
    }
  };

  // 5. Upload hình nền tùy chỉnh từ máy tính
  const handleBgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Lỗi tệp tin', 'Chỉ chấp nhận file hình ảnh làm hình nền');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'Ảnh quá lớn', 'Kích thước ảnh nền tối đa là 5MB');
      return;
    }

    try {
      setIsUploadingBg(true);
      addToast('info', 'Đang tải hình nền...', 'Đang xử lý và tải ảnh nền lên máy chủ...');
      const updated = await chatService.updateConversationBackground(activeConv._id, file);
      if (updated) {
        setConversations((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        addToast('success', 'Thành công', 'Đã cập nhật ảnh nền tùy chỉnh!');
      }
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh nền:', err);
      addToast('error', 'Lỗi tải ảnh nền', err.response?.data?.message || err.message || 'Không thể cập nhật ảnh nền');
    } finally {
      setIsUploadingBg(false);
    }
  };

  // 6. Đặt lại hình nền mặc định
  const handleResetBackground = async () => {
    if (!activeConv) return;
    try {
      const updated = await chatService.updateConversation(activeConv._id, {
        background: {
          url: null,
          gradient: null,
        },
      });
      if (updated) {
        setConversations((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c))
        );
        addToast('success', 'Đặt lại hình nền', 'Đã đưa hình nền về mặc định!');
      }
    } catch (err: any) {
      console.error('Lỗi đặt lại hình nền:', err);
      addToast('error', 'Lỗi cập nhật', err.response?.data?.message || err.message || 'Không thể đặt lại hình nền');
    }
  };

  // Đóng bảng chọn Emoji / Sticker khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  // Chèn Emoji vào ô nhập tin nhắn
  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    chatInputRef.current?.focus();
  };

  // Gửi ngay Sticker động qua Socket.IO
  const handleSelectSticker = (sticker: { id: string; name: string; url: string }) => {
    if (!activeConvId || !socket) return;

    socket.emit('send_message', {
      conversationId: activeConvId,
      content: '[Nhãn dán]',
      type: 'sticker',
      file: {
        url: sticker.url,
        fileName: sticker.name,
      },
    });

    setShowPicker(false);
  };

  // Chọn cuộc trò chuyện
  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
  };

  // Bắt đầu trò chuyện với một người bạn
  const handleStartChatWithFriend = useCallback(
    async (friend: IFriendUser) => {
      try {
        const conv = await chatService.getOrCreateConversation(friend._id);
        if (conv) {
          setConversations((prev) => {
            const exists = prev.find((c) => c._id === conv._id);
            if (exists) return prev;
            return [conv, ...prev];
          });
          setActiveNavTab('chats');
          setActiveConvId(conv._id);
          addToast(
            'success',
            'Bắt đầu trò chuyện',
            `Đang trò chuyện với ${friend.fullName || friend.username}`
          );
        }
      } catch (err) {
        console.error('Lỗi khi mở cuộc trò chuyện:', err);
        addToast('error', 'Lỗi', 'Không thể khởi tạo cuộc trò chuyện');
      }
    },
    [addToast]
  );

  // Xử lý khi tạo nhóm trò chuyện mới thành công
  const handleGroupCreated = useCallback((newGroup: IChatConversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === newGroup._id);
      if (exists) return prev;
      return [newGroup, ...prev];
    });
    setActiveNavTab('chats');
    setActiveConvId(newGroup._id);
  }, []);

  // Huỷ kết bạn
  const handleUnfriend = async (friend: IFriendUser) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn hủy kết bạn với ${friend.fullName || friend.username}?`
      )
    ) {
      return;
    }
    try {
      const res = await friendService.unfriend(friend._id);
      if (res.success) {
        addToast(
          'info',
          'Đã hủy kết bạn',
          `Đã hủy kết bạn với ${friend.fullName || friend.username}`
        );
        setFriends((prev) => prev.filter((f) => f._id !== friend._id));
        loadConversations();
      }
    } catch (err: any) {
      addToast('error', 'Lỗi', err.message || 'Không thể hủy kết bạn');
    }
  };

  // Đóng modal bạn bè và cập nhật lại badge lời mời
  const handleCloseFriendModal = useCallback(() => {
    setIsFriendModalOpen(false);
    friendService
      .getFriendRequests()
      .then((res) => {
        if (res?.received) setPendingReqCount(res.received.length);
      })
      .catch(() => { });
    loadFriendsData();
    loadConversations();
  }, [loadFriendsData, loadConversations]);

  // Lọc danh sách hội thoại
  const filteredConversations = conversations.filter((c) => {
    const name = getConvName(c);
    const lastMsg = getConvLastMessage(c);
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastMsg.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'unread') return getConvUnreadCount(c) > 0;
    if (filterTab === 'groups') return c.type === 'group';
    if (filterTab === 'online') return getConvIsOnline(c);
    return true;
  });

  // Lọc danh sách bạn bè
  const filteredFriendsList = friends.filter((f) => {
    const q = friendSearchQuery.toLowerCase().trim();
    if (q) {
      const match =
        f.username.toLowerCase().includes(q) ||
        (f.fullName && f.fullName.toLowerCase().includes(q)) ||
        (f.email && f.email.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (friendFilterTab === 'online') return f.isOnline || onlineUserIds.has(f._id);
    return true;
  });

  return (
    <div className="chat-app-root">
      {/* 1. Left Nav Rail */}
      <aside className="chat-nav-rail">
        <div className="rail-top">
          <div className="app-badge-logo" title="OpenChat Real-time">
            ⚡
          </div>
          <nav className="rail-nav-items">
            <button
              type="button"
              className={`rail-btn ${activeNavTab === 'chats' ? 'active' : ''}`}
              title="Tin nhắn (Hộp thoại)"
              onClick={() => setActiveNavTab('chats')}
            >
              <MessageSquare size={20} />
            </button>
            <button
              type="button"
              className={`rail-btn ${activeNavTab === 'friends' ? 'active' : ''}`}
              title="Danh sách bạn bè"
              onClick={() => setActiveNavTab('friends')}
            >
              <Users size={20} />
              {pendingReqCount > 0 && <span className="dot-unread" />}
            </button>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`rail-btn ${isNotificationOpen ? 'active' : ''}`}
                title="Thông báo"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
              >
                <Bell size={20} />
                {unreadNotifCount > 0 && (
                  <span className="rail-btn-badge">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onClearAll={handleClearAllNotifications}
                onOpenFriendRequests={() => {
                  setIsFriendModalOpen(true);
                }}
              />
            </div>
          </nav>
        </div>

        <div className="rail-bottom">
          <div
            className="rail-user-avatar"
            onClick={() => setIsProfileModalOpen(true)}
            title={`Hồ sơ: ${user?.username || 'Người dùng'} (Click để chỉnh sửa)`}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.username || 'Avatar'}
                className="rail-avatar-img"
              />
            ) : user?.username ? (
              user.username.charAt(0).toUpperCase()
            ) : (
              'U'
            )}
            <span className="rail-online-dot" />
          </div>
          <button
            type="button"
            className="rail-btn btn-rail-profile"
            onClick={() => setIsProfileModalOpen(true)}
            title="Cài đặt tài khoản & Avatar"
          >
            <Settings size={18} />
          </button>
          <button
            type="button"
            className="rail-btn btn-rail-logout"
            onClick={logout}
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* 2. Middle Panel: Conversations or Friends */}
      <section className="conv-list-panel">
        {activeNavTab === 'chats' ? (
          <>
            <div className="conv-header">
              <div className="conv-title-row">
                <div className="conv-title-left">
                  <h2>Hộp thoại</h2>
                  <div className="live-status-chip">
                    <span className="chip-dot" />
                    <span>Real-time</span>
                  </div>
                </div>
                <div className="conv-title-actions" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn-open-group-modal"
                    onClick={() => setIsCreateGroupModalOpen(true)}
                    title="Tạo nhóm trò chuyện mới"
                  >
                    <Users size={14} />
                    <span>Tạo nhóm</span>
                  </button>
                  <button
                    type="button"
                    className="btn-open-friend-modal"
                    onClick={() => setIsFriendModalOpen(true)}
                    title="Tìm kiếm bạn mới & Quản lý kết bạn"
                  >
                    <UserPlus size={14} />
                    <span>Thêm bạn</span>
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="conv-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm bạn bè hoặc tin nhắn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Tabs */}
              <div className="conv-filter-tabs">
                <button
                  type="button"
                  className={`filter-tab ${filterTab === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterTab('all')}
                >
                  Tất cả ({conversations.length})
                </button>
                <button
                  type="button"
                  className={`filter-tab ${filterTab === 'groups' ? 'active' : ''}`}
                  onClick={() => setFilterTab('groups')}
                >
                  Nhóm ({conversations.filter((c) => c.type === 'group').length})
                </button>
                <button
                  type="button"
                  className={`filter-tab ${filterTab === 'unread' ? 'active' : ''}`}
                  onClick={() => setFilterTab('unread')}
                >
                  Chưa đọc
                </button>
                <button
                  type="button"
                  className={`filter-tab ${filterTab === 'online' ? 'active' : ''}`}
                  onClick={() => setFilterTab('online')}
                >
                  Online
                </button>
              </div>
            </div>

            {/* Stories / Online Friends Carousel */}
            {friends.some((f) => f.isOnline || onlineUserIds.has(f._id)) && (
              <div className="online-stories-row">
                {friends
                  .filter((f) => f.isOnline || onlineUserIds.has(f._id))
                  .map((f) => (
                    <div
                      key={f._id}
                      className="story-item"
                      onClick={() => handleStartChatWithFriend(f)}
                      title={`Bắt đầu trò chuyện với ${f.fullName || f.username}`}
                    >
                      <div className="story-avatar-wrapper">
                        <img
                          src={
                            f.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={f.username}
                        />
                        <span className="story-online-indicator" />
                      </div>
                      <span className="story-name">
                        {(f.fullName || f.username).split(' ')[0]}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Conversations Scrollable List */}
            <div className="conv-scroll-list">
              {isLoadingConversations ? (
                <div className="no-conv-found">
                  <Loader2 size={28} className="spin-loader" />
                  <p>Đang tải danh sách hội thoại...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="no-conv-found">
                  <MessageSquare size={36} opacity={0.3} />
                  <p>Chưa có cuộc trò chuyện nào</p>
                  <span className="no-conv-subtext">
                    Hãy kết bạn hoặc mở danh bạ để trò chuyện!
                  </span>
                  <button
                    type="button"
                    className="btn-search-new-friends"
                    onClick={() => setIsFriendModalOpen(true)}
                  >
                    <UserPlus size={14} />
                    <span>Tìm bạn mới</span>
                  </button>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isActive = c._id === activeConvId;
                  const isOnline = getConvIsOnline(c);
                  const name = getConvName(c);
                  const avatar = getConvAvatar(c);
                  const lastMessage = getConvLastMessage(c);
                  const lastMessageTime = getConvLastMessageTime(c);
                  const unreadCount = getConvUnreadCount(c);

                  return (
                    <div
                      key={c._id}
                      className={`conv-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectConversation(c._id)}
                    >
                      <div className="conv-avatar-box">
                        <img src={avatar} alt={name} className="conv-avatar-img" />
                        {isOnline && <span className="conv-online-badge" />}
                      </div>

                      <div className="conv-info">
                        <div className="conv-info-top">
                          <span className="conv-name">{name}</span>
                          <span className="conv-time">{lastMessageTime}</span>
                        </div>
                        <div className="conv-info-bottom">
                          <span className="conv-preview">{lastMessage}</span>
                          {unreadCount > 0 && (
                            <span className="conv-unread-pill">{unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Friends List Tab */
          <>
            <div className="conv-header">
              <div className="conv-title-row">
                <div className="conv-title-left">
                  <h2>Bạn bè</h2>
                  <span className="friend-count-chip">{friends.length} người</span>
                </div>
                <button
                  type="button"
                  className="btn-open-friend-modal"
                  onClick={() => setIsFriendModalOpen(true)}
                  title="Tìm kiếm bạn mới & Quản lý kết bạn"
                >
                  <UserPlus size={15} />
                  <span>Thêm bạn</span>
                </button>
              </div>

              {/* Search Box for Friends */}
              <div className="conv-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm trong danh bạ bạn bè..."
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Tabs for Friends */}
              <div className="conv-filter-tabs">
                <button
                  type="button"
                  className={`filter-tab ${friendFilterTab === 'all' ? 'active' : ''}`}
                  onClick={() => setFriendFilterTab('all')}
                >
                  Tất cả ({friends.length})
                </button>
                <button
                  type="button"
                  className={`filter-tab ${friendFilterTab === 'online' ? 'active' : ''}`}
                  onClick={() => setFriendFilterTab('online')}
                >
                  Đang online (
                  {
                    friends.filter(
                      (f) => f.isOnline || onlineUserIds.has(f._id)
                    ).length
                  }
                  )
                </button>
              </div>
            </div>

            {/* Friends Scrollable List */}
            <div className="conv-scroll-list">
              {isLoadingFriends ? (
                <div className="no-conv-found">
                  <Loader2 size={28} className="spin-loader" />
                  <p>Đang tải danh sách bạn bè...</p>
                </div>
              ) : filteredFriendsList.length === 0 ? (
                <div className="no-conv-found">
                  <Users size={36} opacity={0.3} />
                  <p>
                    {friends.length === 0
                      ? 'Bạn chưa có người bạn nào'
                      : 'Không tìm thấy bạn bè phù hợp'}
                  </p>
                  <span className="no-conv-subtext">
                    {friends.length === 0
                      ? 'Hãy bấm "Thêm bạn" để kết nối với mọi người!'
                      : 'Thử kiểm tra lại từ khóa tìm kiếm.'}
                  </span>
                  <button
                    type="button"
                    className="btn-search-new-friends"
                    onClick={() => setIsFriendModalOpen(true)}
                  >
                    <UserPlus size={14} />
                    <span>Tìm bạn mới</span>
                  </button>
                </div>
              ) : (
                filteredFriendsList.map((f) => {
                  const isOnline = f.isOnline || onlineUserIds.has(f._id);
                  return (
                    <div key={f._id} className="friend-sidebar-item">
                      <div className="friend-sidebar-avatar-box">
                        {f.avatar ? (
                          <img
                            src={f.avatar}
                            alt={f.username}
                            className="conv-avatar-img"
                          />
                        ) : (
                          <div className="conv-avatar-fallback">
                            {f.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isOnline && <span className="conv-online-badge" />}
                      </div>

                      <div className="friend-sidebar-info">
                        <span className="friend-sidebar-name">
                          {f.fullName || f.username}
                        </span>
                        <span className="friend-sidebar-meta">
                          {isOnline ? (
                            <span className="status-text-online">🟢 Trực tuyến</span>
                          ) : (
                            <span className="status-text-offline">Offline</span>
                          )}
                        </span>
                      </div>

                      <div className="friend-sidebar-actions">
                        <button
                          type="button"
                          className="btn-friend-quick-chat"
                          onClick={() => handleStartChatWithFriend(f)}
                          title="Nhắn tin với bạn này"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-friend-quick-unfriend"
                          onClick={() => handleUnfriend(f)}
                          title="Hủy kết bạn"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>

      {/* 3. Main Chat View */}
      <main className="chat-main-window">
        {!activeConv ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon-wrap">
              <MessageSquare size={48} />
            </div>
            <h3>Chào mừng bạn đến với OpenChat</h3>
            <p>
              Chọn một cuộc hội thoại hoặc chọn một người bạn từ danh bạ để bắt đầu nhắn
              tin real-time!
            </p>
            <button
              type="button"
              className="btn-open-friend-modal"
              style={{
                marginTop: '1rem',
                padding: '0.65rem 1.25rem',
                fontSize: '0.9rem',
              }}
              onClick={() => setIsFriendModalOpen(true)}
            >
              <UserPlus size={16} />
              <span>Tìm bạn mới</span>
            </button>
          </div>
        ) : (
          <>
            {/* Chat Top Header */}
            <header className="chat-header">
              <div className="chat-header-user">
                <div className="header-avatar-box">
                  <img
                    src={getConvAvatar(activeConv)}
                    alt={getConvName(activeConv)}
                  />
                  {getConvIsOnline(activeConv) && (
                    <span className="header-online-dot" />
                  )}
                </div>
                <div className="header-user-meta">
                  <h3>{getConvName(activeConv)}</h3>
                  <p className="header-status">
                    {getConvIsOnline(activeConv) ? (
                      <span className="status-online">
                        <Circle size={8} fill="currentColor" /> Đang hoạt động
                      </span>
                    ) : (
                      <span className="status-offline">Offline</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="chat-header-actions">
                {/* User Session Info Pill */}
                <div
                  className="session-info-pill"
                  title="Tài khoản hiện tại của bạn"
                >
                  <span className="user-icon-tag">
                    <ShieldCheck size={14} />
                  </span>
                  <span className="session-username">
                    {user?.username || 'Người dùng'}
                  </span>
                  <span className="session-role">{user?.role || 'EU'}</span>
                </div>

                <button
                  type="button"
                  className="action-icon-btn"
                  title="Gọi thoại (Voice Call)"
                >
                  <Phone size={17} />
                </button>
                <button
                  type="button"
                  className="action-icon-btn"
                  title="Gọi video"
                >
                  <Video size={17} />
                </button>
                <button
                  type="button"
                  className="action-icon-btn"
                  onClick={() => setShowRightPanel(true)}
                  title="Tùy chỉnh chủ đề & Hình nền"
                >
                  <Palette size={17} />
                </button>
                <button
                  type="button"
                  className={`action-icon-btn ${showRightPanel ? 'active' : ''}`}
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  title="Xem thông tin chi tiết & cài đặt"
                >
                  <Info size={17} />
                </button>
              </div>
            </header>

            {/* Messages Stream Container */}
            <div
              className={`messages-stream ${activeConv.theme ? `theme-${activeConv.theme}` : 'theme-default'}`}
              style={{
                backgroundImage: activeConv.background?.url
                  ? `linear-gradient(rgba(13, 17, 28, 0.8), rgba(13, 17, 28, 0.8)), url(${activeConv.background.url})`
                  : undefined,
                background:
                  !activeConv.background?.url && activeConv.background?.gradient
                    ? activeConv.background.gradient
                    : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="stream-date-separator">
                <span>Hôm nay, {new Date().toLocaleDateString('vi-VN')}</span>
              </div>

              {isLoadingMessages ? (
                <div className="no-conv-found" style={{ margin: 'auto' }}>
                  <Loader2 size={28} className="spin-loader" />
                  <p>Đang tải tin nhắn...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="no-conv-found" style={{ margin: 'auto' }}>
                  <MessageSquare size={36} opacity={0.3} />
                  <p>Chưa có tin nhắn nào</p>
                  <span className="no-conv-subtext">
                    Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện! 👋
                  </span>
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId = (
                    msg.senderId?._id ||
                    (msg.senderId as any) ||
                    ''
                  )?.toString();
                  const isMe = senderId === currentUserId;
                  const senderName = isMe
                    ? 'Bạn'
                    : msg.senderId?.username || getConvName(activeConv);
                  const senderAvatar = isMe
                    ? user?.avatar || ''
                    : msg.senderId?.avatar || getConvAvatar(activeConv);
                  const timeFormatted = new Date(msg.createdAt).toLocaleTimeString(
                    [],
                    { hour: '2-digit', minute: '2-digit' }
                  );
                  const seenUsers = lastReadMap.get(msg._id) || [];

                  return (
                    <div
                      key={msg._id}
                      className={`msg-row ${isMe ? 'msg-outgoing' : 'msg-incoming'}`}
                    >
                      {!isMe && (
                        <div className="msg-sender-avatar">
                          <img
                            src={
                              senderAvatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={senderName}
                          />
                        </div>
                      )}

                      <div className="msg-bubble-group">
                        {!isMe && (
                          <span className="msg-sender-name">{senderName}</span>
                        )}

                        <div
                          className={`msg-bubble ${msg.type === 'sticker'
                            ? 'msg-sticker-wrapper'
                            : isOnlyEmoji(msg.content)
                              ? 'bubble-jumbo-emoji'
                              : ''
                            }`}
                        >
                          {/* Sticker Message */}
                          {msg.type === 'sticker' && msg.file?.url && (
                            <img
                              src={msg.file.url}
                              alt={msg.file.fileName || 'Sticker'}
                              className="msg-sticker-img"
                              title={msg.file.fileName || 'Nhãn dán'}
                            />
                          )}

                          {/* Image Attachment Preview */}
                          {msg.type === 'image' && msg.file?.url && (
                            <div
                              className="msg-image-attachment"
                              onClick={() => window.open(msg.file?.url, '_blank')}
                              title="Bấm để xem ảnh kích thước gốc"
                              style={{ cursor: 'pointer' }}
                            >
                              <img src={msg.file.url} alt="Attachment" />
                              {msg.file.fileName && (
                                <span className="attachment-caption">
                                  {msg.file.fileName}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Message Text (Text or Jumbo Emoji) */}
                          {msg.content && msg.type !== 'sticker' && (
                            <p
                              className={`msg-text ${isOnlyEmoji(msg.content) ? 'msg-jumbo-emoji-text' : ''
                                }`}
                            >
                              {msg.content}
                            </p>
                          )}
                        </div>

                        <div className="msg-meta-row">
                          <span className="msg-time">{timeFormatted}</span>
                          {isMe && (
                            <span className="msg-status-icon">
                              {msg.status === 'read' ? (
                                <CheckCheck size={14} className="icon-read" />
                              ) : (
                                <Check size={14} className="icon-sent" />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Avatars nhỏ của thành viên đã xem tin nhắn này */}
                        {seenUsers.length > 0 && (
                          <div
                            className="msg-seen-by-row"
                            title={`Đã xem bởi: ${seenUsers.map((u) => u.username || 'Thành viên').join(', ')}`}
                          >
                            <div className="seen-avatars-stack">
                              {seenUsers.slice(0, 5).map((u) => (
                                <img
                                  key={u._id}
                                  src={
                                    u.avatar ||
                                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                                  }
                                  alt={u.username}
                                  title={`${u.username} đã xem`}
                                  className="seen-user-avatar"
                                />
                              ))}
                              {seenUsers.length > 5 && (
                                <span
                                  className="seen-count-badge"
                                  title={`và ${seenUsers.length - 5} người khác`}
                                >
                                  +{seenUsers.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {isOtherTyping && (
                <div className="msg-row msg-incoming typing-bubble-row">
                  <div className="msg-sender-avatar">
                    <img src={getConvAvatar(activeConv)} alt="Typing" />
                  </div>
                  <div className="typing-indicator-box">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <footer className="chat-input-bar">
              {/* Emoji & Sticker Picker Popup */}
              {showPicker && (
                <div className="emoji-sticker-picker" ref={pickerRef}>
                  <div className="picker-tabs-header">
                    <button
                      type="button"
                      className={`picker-tab-btn ${pickerTab === 'emoji' ? 'active' : ''}`}
                      onClick={() => setPickerTab('emoji')}
                    >
                      <Smile size={16} />
                      <span>Biểu tượng</span>
                    </button>
                    <button
                      type="button"
                      className={`picker-tab-btn ${pickerTab === 'sticker' ? 'active' : ''}`}
                      onClick={() => setPickerTab('sticker')}
                    >
                      <Sparkles size={16} />
                      <span>Nhãn dán</span>
                    </button>
                  </div>

                  <div className="picker-content-scroll">
                    {pickerTab === 'emoji' ? (
                      <div>
                        {EMOJI_CATEGORIES.map((cat, idx) => (
                          <div key={idx} className="emoji-category-block">
                            <span className="emoji-category-title">{cat.name}</span>
                            <div className="emoji-grid">
                              {cat.emojis.map((emoji, eIdx) => (
                                <button
                                  key={eIdx}
                                  type="button"
                                  className="emoji-btn-item"
                                  onClick={() => handleSelectEmoji(emoji)}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="sticker-grid">
                        {STICKER_LIST.map((sticker) => (
                          <button
                            key={sticker.id}
                            type="button"
                            className="sticker-item-btn"
                            onClick={() => handleSelectSticker(sticker)}
                            title={sticker.name}
                          >
                            <img
                              src={sticker.url}
                              alt={sticker.name}
                              className="sticker-preview-img"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <div className="input-actions-left">
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="input-util-btn"
                    title="Gửi ảnh"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? <Loader2 size={18} className="spin-loader" /> : <Image size={18} />}
                  </button>
                  <button
                    type="button"
                    className="input-util-btn"
                    title="Đính kèm tệp tin"
                  >
                    <Paperclip size={18} />
                  </button>
                </div>

                <div className="input-textarea-wrapper">
                  <input
                    ref={chatInputRef}
                    type="text"
                    placeholder={`Nhắn tin cho ${getConvName(
                      activeConv
                    )}... (Nhấn Enter để gửi)`}
                    value={inputText}
                    onChange={handleInputChange}
                    autoFocus
                  />
                  <button
                    type="button"
                    className={`emoji-btn ${showPicker ? 'active' : ''}`}
                    title="Biểu tượng cảm xúc & Nhãn dán"
                    onClick={() => setShowPicker((prev) => !prev)}
                  >
                    <Smile size={18} />
                  </button>
                </div>

                <button
                  type="submit"
                  className={`btn-send-message ${inputText.trim() ? 'active' : ''}`}
                  disabled={!inputText.trim()}
                  title="Gửi tin nhắn"
                >
                  <Send size={18} />
                </button>
              </form>
            </footer>
          </>
        )}
      </main>

      {/* 4. Right Contact Info Details (Toggleable) */}
      {showRightPanel && activeConv && (
        <aside className="chat-detail-panel">
          <div className="detail-header">
            <h3>Thông tin hội thoại</h3>
            <button
              type="button"
              className="btn-close-detail"
              onClick={() => setShowRightPanel(false)}
              title="Đóng bảng thông tin"
            >
              <X size={18} />
            </button>
          </div>

          <div className="detail-profile-center">
            <div className="detail-avatar-large">
              <img
                src={getConvAvatar(activeConv)}
                alt={getConvName(activeConv)}
              />
              {getConvIsOnline(activeConv) && (
                <span className="detail-online-badge" />
              )}
              {activeConv.type === 'group' && (
                <>
                  <input
                    type="file"
                    ref={groupAvatarInputRef}
                    accept="image/*"
                    onChange={handleGroupAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="detail-avatar-edit-btn"
                    onClick={() => groupAvatarInputRef.current?.click()}
                    disabled={isUploadingGroupAvatar}
                    title="Đổi ảnh đại diện nhóm"
                  >
                    {isUploadingGroupAvatar ? (
                      <Loader2 size={14} className="spin-loader" />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>
                </>
              )}
            </div>

            {activeConv.type === 'group' && isEditingGroupName ? (
              <div className="detail-rename-group-box">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveGroupName();
                    if (e.key === 'Escape') setIsEditingGroupName(false);
                  }}
                  autoFocus
                  className="detail-rename-input"
                  placeholder="Nhập tên nhóm mới..."
                />
                <button
                  type="button"
                  className="detail-rename-save"
                  onClick={handleSaveGroupName}
                  title="Lưu tên mới"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  className="detail-rename-cancel"
                  onClick={() => setIsEditingGroupName(false)}
                  title="Hủy"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="detail-name-row">
                <h4>{getConvName(activeConv)}</h4>
                {activeConv.type === 'group' && (
                  <button
                    type="button"
                    className="btn-edit-group-name"
                    onClick={handleStartEditGroupName}
                    title="Đổi tên nhóm"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>
            )}

            <span className="detail-role-tag">
              {activeConv.type === 'group'
                ? `Nhóm (${activeConv.participants?.length || 0} thành viên)`
                : 'Bạn bè'}
            </span>
            <p className="detail-status-text">
              {activeConv.type === 'group'
                ? 'Nhóm trò chuyện'
                : getConvIsOnline(activeConv)
                ? '🟢 Đang trực tuyến'
                : 'Offline'}
            </p>
          </div>

          <div className="detail-quick-actions">
            <button type="button" className="quick-action-btn">
              <Bell size={16} />
              <span>Tắt chuông</span>
            </button>
            <button type="button" className="quick-action-btn">
              <Search size={16} />
              <span>Tìm kiếm</span>
            </button>
          </div>

          {/* Theme & Background Settings */}
          <div className="detail-section theme-settings-section">
            <div className="detail-section-title">
              <span>Chủ đề & Hình nền</span>
              <Palette size={16} />
            </div>

            {/* Accent theme selection */}
            <div className="theme-picker-group">
              <label className="theme-label">Màu sắc chủ đạo:</label>
              <div className="theme-colors-grid">
                {THEME_OPTIONS.map((t) => {
                  const isSelected = (activeConv.theme || 'default') === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`theme-badge-btn ${isSelected ? 'active' : ''}`}
                      style={{ background: t.color }}
                      onClick={() => handleSelectTheme(t.id)}
                      title={t.name}
                    >
                      {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background selection */}
            <div className="wallpaper-picker-group">
              <div className="wallpaper-label-row">
                <label className="theme-label">Hình nền đoạn chat:</label>
                {(activeConv.background?.url || activeConv.background?.gradient) && (
                  <button
                    type="button"
                    className="btn-reset-wallpaper-text"
                    onClick={handleResetBackground}
                    title="Xóa hình nền trở về mặc định"
                  >
                    <RotateCcw size={12} />
                    <span>Mặc định</span>
                  </button>
                )}
              </div>

              <div className="wallpaper-presets-grid">
                {WALLPAPER_PRESETS.map((wp) => {
                  const isSelected =
                    !activeConv.background?.url &&
                    (activeConv.background?.gradient || '') === wp.gradient;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      className={`wallpaper-preset-btn ${isSelected ? 'active' : ''}`}
                      style={{
                        background: wp.gradient || '#151d30',
                      }}
                      onClick={() => handleSelectGradient(wp.gradient)}
                      title={wp.name}
                    >
                      {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>

              {/* Upload custom wallpaper photo */}
              <div className="wallpaper-upload-box">
                <input
                  type="file"
                  ref={bgFileInputRef}
                  accept="image/*"
                  onChange={handleBgFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn-upload-wallpaper"
                  onClick={() => bgFileInputRef.current?.click()}
                  disabled={isUploadingBg}
                >
                  {isUploadingBg ? (
                    <>
                      <Loader2 size={14} className="spin-loader" />
                      <span>Đang tải ảnh nền...</span>
                    </>
                  ) : (
                    <>
                      <Image size={14} />
                      <span>Tải ảnh nền từ máy tính</span>
                    </>
                  )}
                </button>
                {activeConv.background?.url && (
                  <div className="current-bg-preview">
                    <img src={activeConv.background.url} alt="Current wallpaper" />
                    <span>Ảnh nền tùy chỉnh đang dùng</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Group Members List */}
          {activeConv.type === 'group' && (
            <div className="detail-section">
              <div className="detail-section-title">
                <span>Thành viên nhóm ({activeConv.participants?.length || 0})</span>
                <Users size={16} />
              </div>
              <div className="group-members-list">
                {activeConv.participants?.map((member) => (
                  <div key={member._id} className="group-member-item">
                    <div className="group-member-avatar">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt={member.username}
                      />
                    </div>
                    <div className="group-member-info">
                      <span className="group-member-name">
                        {member.username}
                        {member._id === currentUserId && <span className="member-me-tag">(Bạn)</span>}
                        {member._id === activeConv.creatorId && <span className="member-creator-tag">Trưởng nhóm</span>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Participant Details */}
          {activeConv.type === 'direct' && getOtherParticipant(activeConv) && (
            <div
              style={{
                padding: '0 1.25rem',
                margin: '1rem 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.825rem',
                color: 'var(--text-muted)',
              }}
            >
              <div>
                <b style={{ color: 'var(--text-main)' }}>Tên đăng nhập:</b>{' '}
                {getOtherParticipant(activeConv)?.username}
              </div>
              {getOtherParticipant(activeConv)?.gender && (
                <div>
                  <b style={{ color: 'var(--text-main)' }}>Giới tính:</b>{' '}
                  {getOtherParticipant(activeConv)?.gender === 'male' ? 'Nam' : 'Nữ'}
                </div>
              )}
              {getOtherParticipant(activeConv)?.phone && (
                <div>
                  <b style={{ color: 'var(--text-main)' }}>Số điện thoại:</b>{' '}
                  {getOtherParticipant(activeConv)?.phone}
                </div>
              )}
              {getOtherParticipant(activeConv)?.address && (
                <div>
                  <b style={{ color: 'var(--text-main)' }}>Địa chỉ:</b>{' '}
                  {getOtherParticipant(activeConv)?.address}
                </div>
              )}
            </div>
          )}

          {/* Shared Files & Media */}
          <div className="detail-section">
            <div className="detail-section-title">
              <span>Phương tiện & Tệp đã gửi</span>
              <span className="section-count">Tập tin</span>
            </div>
            <div className="shared-file-row">
              <div className="file-icon-box">
                <FileText size={16} />
              </div>
              <div className="file-meta">
                <span className="file-name">OpenChat_Realtime_Ready.pdf</span>
                <span className="file-size">Socket.IO & MongoDB</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Profile & Avatar Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onToast={addToast}
      />

      {/* Friend & Contact Search / Add Modal */}
      <FriendModal
        isOpen={isFriendModalOpen}
        onClose={handleCloseFriendModal}
        onToast={addToast}
        onStartChat={handleStartChatWithFriend}
        onFriendChange={loadFriendsData}
      />

      {/* Create Group Chat Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        friends={friends}
        onGroupCreated={handleGroupCreated}
        onToast={addToast}
      />

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default ChatPage;
