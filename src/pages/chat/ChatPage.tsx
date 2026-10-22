import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts';
import {
  INITIAL_CONVERSATIONS,
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
} from 'lucide-react';
import { ProfileModal, Toast, type ToastMessage } from '../../components';
import './ChatPage.css';

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();

  const [conversations, setConversations] = useState<IConversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Profile modal and toast state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Active conversation
  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

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

  // Send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

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
            <button type="button" className="rail-btn active" title="Tin nhắn">
              <MessageSquare size={20} />
            </button>
            <button type="button" className="rail-btn" title="Nhóm & Kênh">
              <Users size={20} />
            </button>
            <button type="button" className="rail-btn" title="Thông báo">
              <Bell size={20} />
              <span className="dot-unread" />
            </button>
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

      {/* 2. Conversations List Panel */}
      <section className="conv-list-panel">
        <div className="conv-header">
          <div className="conv-title-row">
            <h2>Hộp thoại</h2>
            <div className="live-status-chip">
              <span className="chip-dot" />
              <span>Real-time</span>
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
              className={`filter-tab ${filterTab === 'groups' ? 'active' : ''}`}
              onClick={() => setFilterTab('groups')}
            >
              Nhóm
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

        {/* Conversations Scrollable List */}
        <div className="conv-scroll-list">
          {filteredConversations.length === 0 ? (
            <div className="no-conv-found">
              <MessageSquare size={32} opacity={0.3} />
              <p>Không tìm thấy cuộc trò chuyện nào</p>
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
      </section>

      {/* 3. Main Chat View */}
      <main className="chat-main-window">
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

            {/* <button
              type="button"
              className="action-icon-btn btn-f5-test"
              onClick={() => window.location.reload()}
              title="F5 Refresh để test giữ phiên đăng nhập"
            >
              <RotateCw size={15} />
              <span>F5 Test</span>
            </button> */}

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
      </main>

      {/* 4. Right Contact Info Details (Toggleable) */}
      {showRightPanel && (
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

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default ChatPage;
