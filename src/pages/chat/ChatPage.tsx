import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth, useSocketEvent } from '../../contexts';
import {
  type IConversation,
  type IMessage,
} from './mockData';
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
} from 'lucide-react';
import { ProfileModal, FriendModal, Toast, NotificationDropdown, type ToastMessage } from '../../components';
import { friendService, notificationService } from '../../services';
import type { IFriendUser, INotificationItem } from '../../interfaces';
import { playNotificationSound } from '../../utils/sound';
import './ChatPage.css';

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();

  const [activeNavTab, setActiveNavTab] = useState<'chats' | 'friends'>('chats');
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Real Friends state
  const [friends, setFriends] = useState<IFriendUser[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendFilterTab, setFriendFilterTab] = useState<'all' | 'online'>('all');

  // Profile modal and toast state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
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

  // Lấy thông báo từ DB và số lượng lời mời kết bạn khi tải trang
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

  // Lắng nghe sự kiện nhận lời mời kết bạn Realtime từ Backend
  useSocketEvent('res_add_contact', (data: any) => {
    console.log('⚡ [Socket] Nhận lời mời kết bạn:', data);
    const senderName = data?.userCurent?.username || 'Một người dùng';
    const message = data?.message || `${senderName} vừa gửi cho bạn một lời mời kết bạn!`;

    // 1. Phát âm thanh chuông thông báo
    playNotificationSound();

    // 2. Thêm vào danh sách thông báo của Chuông
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

    // 3. Bật thông báo Toast
    addToast('info', 'Lời mời kết bạn mới 👋', message);

    // 4. Tăng số đếm lời mời đang chờ trên badge icon
    setPendingReqCount((prev) => prev + 1);
  });

  // Lắng nghe sự kiện khi đối phương huỷ lời mời kết bạn Realtime
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

  // Tải danh sách bạn bè thật từ Backend & đồng bộ sang hội thoại
  const loadFriendsData = useCallback(async () => {
    try {
      setIsLoadingFriends(true);
      const data = await friendService.getFriends();
      setFriends(data);

      setConversations((prev) => {
        const prevMap = new Map(prev.map((c) => [c.id, c]));
        return data.map((f) => {
          const existing = prevMap.get(f._id);
          if (existing) {
            return {
              ...existing,
              name: f.fullName || f.username,
              avatar: f.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              isOnline: !!f.isOnline,
            };
          }
          return {
            id: f._id,
            name: f.fullName || f.username,
            avatar: f.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            isGroup: false,
            isOnline: !!f.isOnline,
            lastMessage: 'Đã kết nối bạn bè! Hãy gửi tin nhắn chào hỏi 👋',
            lastMessageTime: '',
            unreadCount: 0,
            role: 'Bạn bè',
            messages: [],
          };
        });
      });

      setActiveConvId((currId) => {
        if (currId && data.some((f) => f._id === currId)) return currId;
        return data.length > 0 ? data[0]._id : '';
      });
    } catch (err) {
      console.error('Lỗi khi tải danh sách bạn bè:', err);
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  useEffect(() => {
    loadFriendsData();
  }, [loadFriendsData]);

  // Lắng nghe sự kiện đối phương chấp nhận kết bạn Realtime
  useSocketEvent('res_accept_contact', (data: any) => {
    console.log('⚡ [Socket] Đối phương đã chấp nhận kết bạn:', data);
    const senderName = data?.userCurent?.username || 'Đối phương';
    const message = data?.message || `${senderName} đã chấp nhận lời mời kết bạn!`;

    // 1. Phát chuông thông báo
    playNotificationSound();

    // 2. Thêm vào chuông thông báo
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

    // 3. Hiện Toast
    addToast('success', 'Kết bạn thành công 🎉', message);

    // 4. Tải lại danh sách bạn bè thật
    loadFriendsData();
  });

  // Lắng nghe sự kiện bạn bè thay đổi trạng thái Online/Offline Realtime
  useSocketEvent('user_status_change', (data: { userId: string; isOnline: boolean }) => {
    console.log('⚡ [Socket] Trạng thái online của bạn bè thay đổi:', data);
    setFriends((prev) =>
      prev.map((f) => (f._id === data.userId ? { ...f, isOnline: data.isOnline } : f))
    );
    setConversations((prev) => {
      const target = prev.find((c) => c.id === data.userId);
      if (!target || target.isOnline === data.isOnline) return prev;
      return prev.map((c) => (c.id === data.userId ? { ...c, isOnline: data.isOnline } : c));
    });
  });

  // Lắng nghe danh sách bạn bè đang online ban đầu từ Server
  useSocketEvent('online_friends_list', (onlineIds: string[]) => {
    console.log('⚡ [Socket] Danh sách bạn bè đang online:', onlineIds);
    setFriends((prev) =>
      prev.map((f) => ({ ...f, isOnline: onlineIds.includes(f._id) }))
    );
    setConversations((prev) => {
      let hasChanged = false;
      const next = prev.map((c) => {
        const isOnline = onlineIds.includes(c.id);
        if (c.isOnline !== isOnline) {
          hasChanged = true;
          return { ...c, isOnline };
        }
        return c;
      });
      return hasChanged ? next : prev;
    });
  });

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
  }, [loadFriendsData]);

  // Hủy kết bạn (Unfriend)
  const handleUnfriend = async (friend: IFriendUser) => {
    if (!window.confirm(`Bạn có chắc muốn hủy kết bạn với ${friend.fullName || friend.username}?`)) {
      return;
    }
    try {
      const res = await friendService.unfriend(friend._id);
      if (res.success) {
        addToast('info', 'Đã hủy kết bạn', `Đã hủy kết bạn với ${friend.fullName || friend.username}`);
        setFriends((prev) => prev.filter((f) => f._id !== friend._id));
        setConversations((prev) => prev.filter((c) => c.id !== friend._id));
        setActiveConvId((curr) => (curr === friend._id ? '' : curr));
      }
    } catch (err: any) {
      addToast('error', 'Lỗi', err.message || 'Không thể hủy kết bạn');
    }
  };

  // Mở khung trò chuyện với bạn bè (từ Danh bạ hoặc Modal)
  const handleStartChatWithFriend = useCallback((friend: IFriendUser) => {
    setActiveNavTab('chats');
    setActiveConvId(friend._id);
    setConversations((prev) => {
      const existing = prev.find(
        (c) =>
          c.id === friend._id ||
          c.name.toLowerCase() === (friend.fullName || friend.username).toLowerCase()
      );

      if (existing) {
        addToast('info', 'Mở hội thoại', `Đang trò chuyện với ${existing.name}`);
        return prev;
      }

      const newConv: IConversation = {
        id: friend._id || `conv-${Date.now()}`,
        name: friend.fullName || friend.username,
        avatar:
          friend.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        isGroup: false,
        lastMessage: 'Đã kết nối bạn bè! Hãy gửi tin nhắn chào hỏi 👋',
        lastMessageTime: 'Vừa xong',
        unreadCount: 0,
        isOnline: !!friend.isOnline,
        role: 'Bạn bè',
        messages: [],
      };

      addToast('success', 'Bắt đầu trò chuyện', `Đã mở hội thoại với ${newConv.name}`);
      return [newConv, ...prev];
    });
  }, [addToast]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Active conversation
  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [activeConv?.messages.length, isTyping]);

  // Select conversation
  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    // Đánh dấu đã đọc
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Filter friends list
  const filteredFriendsList = friends.filter((f) => {
    const q = friendSearchQuery.toLowerCase().trim();
    if (q) {
      const match =
        f.username.toLowerCase().includes(q) ||
        (f.fullName && f.fullName.toLowerCase().includes(q)) ||
        (f.email && f.email.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (friendFilterTab === 'online') return f.isOnline;
    return true;
  });

  // Send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConv || !inputText.trim()) return;

    const newMsg: IMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: user?.username || 'Bạn',
      senderAvatar: user?.avatar,
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      status: 'sent',
    };

    const targetConvId = activeConv.id;
    const sentText = inputText.trim();
    setInputText('');

    // Cập nhật tin nhắn vào hội thoại
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            lastMessage: `Bạn: ${sentText}`,
            lastMessageTime: newMsg.timestamp,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    // Giả lập bot/người bên kia trả lời tự động sau 1.2s (Real-time Simulation)
    if (!activeConv.isGroup) {
      setTimeout(() => {
        setIsTyping(true);
      }, 500);

      setTimeout(() => {
        setIsTyping(false);
        const autoReplies = [
          'Tuyệt vời quá! Mình nhận được tin nhắn rồi nhé 👍',
          'Đồng ý với ý kiến này của bạn, để mình cập nhật lại vào task!',
          'Okie bạn ơi, có gì tí nữa mình trao đổi thêm nha.',
          'Haha chuẩn luôn đó! 🚀',
        ];
        const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];

        const replyMsg: IMessage = {
          id: `reply-${Date.now()}`,
          senderId: targetConvId,
          senderName: activeConv.name.split(' ')[0],
          senderAvatar: activeConv.avatar,
          content: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                lastMessage: randomReply,
                lastMessageTime: replyMsg.timestamp,
                messages: [...c.messages, replyMsg],
              };
            }
            return c;
          })
        );
      }, 2000);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'unread') return c.unreadCount > 0;
    if (filterTab === 'groups') return c.isGroup;
    if (filterTab === 'online') return c.isOnline;
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
              <img src={user.avatar} alt={user?.username || 'Avatar'} className="rail-avatar-img" />
            ) : (
              user?.username ? user.username.charAt(0).toUpperCase() : 'U'
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
                  Tất cả
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
            {conversations.some((c) => c.isOnline) && (
              <div className="online-stories-row">
                {conversations
                  .filter((c) => c.isOnline)
                  .map((c) => (
                    <div
                      key={c.id}
                      className={`story-item ${c.id === activeConvId ? 'selected' : ''}`}
                      onClick={() => handleSelectConversation(c.id)}
                      title={c.name}
                    >
                      <div className="story-avatar-wrapper">
                        <img src={c.avatar} alt={c.name} />
                        <span className="story-online-indicator" />
                      </div>
                      <span className="story-name">{c.name.split(' ')[0]}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Conversations Scrollable List */}
            <div className="conv-scroll-list">
              {filteredConversations.length === 0 ? (
                <div className="no-conv-found">
                  <MessageSquare size={36} opacity={0.3} />
                  <p>Chưa có cuộc trò chuyện nào</p>
                  <span className="no-conv-subtext">Hãy kết bạn hoặc mở danh bạ để trò chuyện!</span>
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
                  const isActive = c.id === activeConvId;
                  return (
                    <div
                      key={c.id}
                      className={`conv-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectConversation(c.id)}
                    >
                      <div className="conv-avatar-box">
                        <img src={c.avatar} alt={c.name} className="conv-avatar-img" />
                        {c.isOnline && <span className="conv-online-badge" />}
                      </div>

                      <div className="conv-info">
                        <div className="conv-info-top">
                          <span className="conv-name">{c.name}</span>
                          <span className="conv-time">{c.lastMessageTime}</span>
                        </div>
                        <div className="conv-info-bottom">
                          <span className="conv-preview">{c.lastMessage}</span>
                          {c.unreadCount > 0 && (
                            <span className="conv-unread-pill">{c.unreadCount}</span>
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
                  <span className="friend-count-chip">
                    {friends.length} người
                  </span>
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
                  Đang online ({friends.filter((f) => f.isOnline).length})
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
                filteredFriendsList.map((f) => (
                  <div key={f._id} className="friend-sidebar-item">
                    <div className="friend-sidebar-avatar-box">
                      {f.avatar ? (
                        <img src={f.avatar} alt={f.username} className="conv-avatar-img" />
                      ) : (
                        <div className="conv-avatar-fallback">
                          {f.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {f.isOnline && <span className="conv-online-badge" />}
                    </div>

                    <div className="friend-sidebar-info">
                      <span className="friend-sidebar-name">{f.fullName || f.username}</span>
                      <span className="friend-sidebar-meta">
                        {f.isOnline ? (
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
                ))
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
            <p>Chọn một người bạn từ danh bạ hoặc bấm <b>"Thêm bạn"</b> để bắt đầu trò chuyện real-time!</p>
            <button
              type="button"
              className="btn-open-friend-modal"
              style={{ marginTop: '1rem', padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
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
                  <img src={activeConv.avatar} alt={activeConv.name} />
                  {activeConv.isOnline && <span className="header-online-dot" />}
                </div>
                <div className="header-user-meta">
                  <h3>{activeConv.name}</h3>
                  <p className="header-status">
                    {activeConv.isOnline ? (
                      <span className="status-online">
                        <Circle size={8} fill="currentColor" /> Đang hoạt động
                      </span>
                    ) : (
                      <span className="status-offline">
                        Hoạt động {activeConv.lastSeen || 'gần đây'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="chat-header-actions">
                {/* User Session Info Pill */}
                <div className="session-info-pill" title="Tài khoản hiện tại của bạn">
                  <span className="user-icon-tag">
                    <ShieldCheck size={14} />
                  </span>
                  <span className="session-username">{user?.username || 'Người dùng'}</span>
                  <span className="session-role">{user?.role || 'EU'}</span>
                </div>

                <button type="button" className="action-icon-btn" title="Gọi thoại (Voice Call)">
                  <Phone size={17} />
                </button>
                <button type="button" className="action-icon-btn" title="Gọi video">
                  <Video size={17} />
                </button>
                <button
                  type="button"
                  className={`action-icon-btn ${showRightPanel ? 'active' : ''}`}
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  title="Xem thông tin chi tiết"
                >
                  <Info size={17} />
                </button>
              </div>
            </header>

            {/* Messages Stream Container */}
            <div className="messages-stream">
              <div className="stream-date-separator">
                <span>Hôm nay, {new Date().toLocaleDateString('vi-VN')}</span>
              </div>

              {activeConv.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`msg-row ${msg.isMe ? 'msg-outgoing' : 'msg-incoming'}`}
                >
                  {!msg.isMe && (
                    <div className="msg-sender-avatar">
                      <img
                        src={msg.senderAvatar || activeConv.avatar}
                        alt={msg.senderName}
                      />
                    </div>
                  )}

                  <div className="msg-bubble-group">
                    {!msg.isMe && <span className="msg-sender-name">{msg.senderName}</span>}

                    <div className="msg-bubble">
                      {/* Image Attachment Preview */}
                      {msg.attachment?.type === 'image' && (
                        <div className="msg-image-attachment">
                          <img src={msg.attachment.url} alt="Attachment" />
                          {msg.attachment.name && (
                            <span className="attachment-caption">{msg.attachment.name}</span>
                          )}
                        </div>
                      )}

                      {/* Message Text */}
                      <p className="msg-text">{msg.content}</p>

                      {/* Reaction Tag */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="msg-reactions">
                          {msg.reactions.map((r, i) => (
                            <span key={i} className="reaction-chip">
                              {r.emoji} {r.count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="msg-meta-row">
                      <span className="msg-time">{msg.timestamp}</span>
                      {msg.isMe && (
                        <span className="msg-status-icon">
                          {msg.status === 'read' ? (
                            <CheckCheck size={14} className="icon-read" />
                          ) : (
                            <Check size={14} className="icon-sent" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="msg-row msg-incoming typing-bubble-row">
                  <div className="msg-sender-avatar">
                    <img src={activeConv.avatar} alt="Typing" />
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
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <div className="input-actions-left">
                  <button type="button" className="input-util-btn" title="Gửi ảnh">
                    <Image size={18} />
                  </button>
                  <button type="button" className="input-util-btn" title="Đính kèm tệp tin">
                    <Paperclip size={18} />
                  </button>
                </div>

                <div className="input-textarea-wrapper">
                  <input
                    type="text"
                    placeholder={`Nhắn tin cho ${activeConv.name}... (Nhấn Enter để gửi)`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="emoji-btn" title="Biểu tượng cảm xúc">
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
              <img src={activeConv.avatar} alt={activeConv.name} />
              {activeConv.isOnline && <span className="detail-online-badge" />}
            </div>
            <h4>{activeConv.name}</h4>
            <span className="detail-role-tag">
              {activeConv.isGroup ? 'Nhóm trò chuyện' : activeConv.role || 'Thành viên'}
            </span>
            <p className="detail-status-text">
              {activeConv.isOnline ? '🟢 Đang trực tuyến' : `Vừa truy cập ${activeConv.lastSeen || 'gần đây'}`}
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

          {/* Shared Files & Media */}
          <div className="detail-section">
            <div className="detail-section-title">
              <span>Phương tiện & Tệp đã gửi</span>
              <span className="section-count">12</span>
            </div>
            <div className="media-preview-grid">
              <div className="media-thumb">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80"
                  alt="Thumb 1"
                />
              </div>
              <div className="media-thumb">
                <img
                  src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80"
                  alt="Thumb 2"
                />
              </div>
              <div className="media-thumb">
                <img
                  src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80"
                  alt="Thumb 3"
                />
              </div>
            </div>

            <div className="shared-file-row">
              <div className="file-icon-box">
                <FileText size={16} />
              </div>
              <div className="file-meta">
                <span className="file-name">Ke_hoach_OpenChat_2026.pdf</span>
                <span className="file-size">2.4 MB • 22/10/2026</span>
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

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default ChatPage;
