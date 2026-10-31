import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  UserPlus,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { INotificationItem } from '../../interfaces';
import './NotificationDropdown.css';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: INotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onOpenFriendRequests?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onOpenFriendRequests,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    filterTab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  // Format thời gian hiển thị tương đối
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return date.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-title">
          <Bell size={18} color="#818cf8" />
          <h3>Thông báo</h3>
          {unreadCount > 0 && <span className="notif-badge-count">{unreadCount} mới</span>}
        </div>

        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="notif-action-icon-btn"
              title="Đánh dấu tất cả đã đọc"
              onClick={onMarkAllAsRead}
            >
              <CheckCheck size={16} />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              className="notif-action-icon-btn"
              title="Xóa tất cả thông báo"
              onClick={onClearAll}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="notif-filter-tabs">
        <button
          type="button"
          className={`notif-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTab('all')}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          type="button"
          className={`notif-tab-btn ${filterTab === 'unread' ? 'active' : ''}`}
          onClick={() => setFilterTab('unread')}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="notif-list">
        {filteredNotifications.length === 0 ? (
          <div className="notif-empty">
            <Sparkles size={36} className="notif-empty-icon" />
            <p>
              {filterTab === 'unread'
                ? 'Tuyệt vời! Không có thông báo chưa đọc'
                : 'Hiện tại bạn chưa có thông báo nào'}
            </p>
            <span>Các cập nhật và lời mời kết bạn sẽ xuất hiện tại đây</span>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`notif-item ${!item.isRead ? 'unread' : ''}`}
              onClick={() => onMarkAsRead(item.id)}
            >
              {/* Avatar / Icon */}
              <div className="notif-avatar-wrapper">
                {item.senderAvatar ? (
                  <img
                    src={item.senderAvatar}
                    alt={item.senderName || 'Avatar'}
                    className="notif-avatar-img"
                  />
                ) : (
                  <div className="notif-avatar-fallback">
                    {(item.senderName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`notif-type-badge ${item.type}`}>
                  {item.type === 'friend_request' ? (
                    <UserPlus size={10} />
                  ) : item.type === 'message' ? (
                    <MessageSquare size={10} />
                  ) : (
                    <Bell size={10} />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="notif-content">
                <div className="notif-item-header">
                  <span className="notif-item-title">{item.title}</span>
                  <span className="notif-time">{formatTime(item.createdAt)}</span>
                </div>
                <p className="notif-item-message">{item.message}</p>

                {/* Quick actions for friend request */}
                {item.type === 'friend_request' && onOpenFriendRequests && (
                  <div className="notif-quick-actions">
                    <button
                      type="button"
                      className="notif-btn-view-request"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(item.id);
                        onClose();
                        onOpenFriendRequests();
                      }}
                    >
                      <ExternalLink size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                      Xem lời mời
                    </button>
                  </div>
                )}
              </div>

              {/* Unread indicator */}
              {!item.isRead && <span className="notif-unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

