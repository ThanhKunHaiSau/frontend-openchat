import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Search,
  UserPlus,
  Check,
  Clock,
  MessageCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
} from 'lucide-react';
import { friendService } from '../../services/friend.service';
import { useSocket, useSocketEvent } from '../../contexts';
import type { IFriendUser, IFriendRequest } from '../../interfaces';
import './FriendModal.css';

interface FriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onStartChat?: (user: IFriendUser) => void;
  onFriendChange?: () => void;
}

export const FriendModal: React.FC<FriendModalProps> = ({
  isOpen,
  onClose,
  onToast,
  onStartChat,
  onFriendChange,
}) => {
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState<'search' | 'requests'>('search');
  const [requestSubTab, setRequestSubTab] = useState<'received' | 'sent'>('received');

  // Search & All Users state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IFriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPage, setTotalPage] = useState(1);

  // Requests state
  const [friendRequests, setFriendRequests] = useState<{
    received: IFriendRequest[];
    sent: IFriendRequest[];
  }>({ received: [], sent: [] });
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Loading state for individual actions (by userId or requestId)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Ref cho onToast để useCallback không bao giờ bị re-create khi prop thay đổi
  const onToastRef = useRef(onToast);
  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  // Load requests
  const loadRequestsData = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const data = await friendService.getFriendRequests();
      setFriendRequests(data);
    } catch (err: any) {
      console.error('Lỗi khi tải lời mời kết bạn:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  // Lấy danh sách người dùng (Tìm kiếm hoặc hiển thị toàn bộ)
  const fetchUsersList = useCallback(
    async (query: string = '', pageNum: number = 1) => {
      try {
        setIsSearching(true);
        const res = await friendService.searchUsers(query, pageNum, 10);
        setSearchResults(res.users);
        setTotalUsers(res.total);
        setTotalPage(res.totalPage);
        setPage(res.page);
      } catch (err: any) {
        onToastRef.current('error', 'Lỗi', err.message || 'Không thể tải danh sách người dùng');
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Ref theo dõi trạng thái modal để chỉ tải dữ liệu khi modal vừa được mở (false -> true)
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      loadRequestsData();
      fetchUsersList('', 1);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, loadRequestsData, fetchUsersList]);

  // Debounced search khi gõ vào ô tìm kiếm (bỏ qua render ban đầu nếu query rỗng)
  const isFirstSearch = useRef(true);
  useEffect(() => {
    if (!isOpen) {
      isFirstSearch.current = true;
      return;
    }
    if (isFirstSearch.current) {
      isFirstSearch.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchUsersList(searchQuery, 1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchUsersList]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lắng nghe sự kiện người khác gửi kết bạn cho mình theo Realtime
  useSocketEvent('res_add_contact', (data: any) => {
    if (isOpen) {
      loadRequestsData();
      const senderId = data?.userCurent?.id;
      if (senderId) {
        setSearchResults((prev) =>
          prev.map((u) => (u._id === senderId ? { ...u, relationshipStatus: 'pending_received' } : u))
        );
      }
    }
  });

  // Lắng nghe sự kiện đối phương huỷ lời mời kết bạn Realtime
  useSocketEvent('res_cancel_contact', (data: any) => {
    if (isOpen) {
      loadRequestsData();
      const senderId = data?.id;
      if (senderId) {
        setSearchResults((prev) =>
          prev.map((u) => (u._id === senderId ? { ...u, relationshipStatus: 'none' } : u))
        );
      }
    }
  });

  // Lắng nghe sự kiện đối phương chấp nhận lời mời kết bạn Realtime
  useSocketEvent('res_accept_contact', (data: any) => {
    if (isOpen) {
      loadRequestsData();
      const senderId = data?.userCurent?.id;
      if (senderId) {
        setSearchResults((prev) =>
          prev.map((u) => (u._id === senderId ? { ...u, relationshipStatus: 'friend' } : u))
        );
      }
      onFriendChange?.();
    }
  });

  if (!isOpen) return null;

  // 1. Gửi lời mời kết bạn
  const handleSendFriendRequest = async (targetUser: IFriendUser) => {
    try {
      setActionLoadingId(targetUser._id);
      const res = await friendService.sendFriendRequest(targetUser._id);
      if (res.success) {
        onToast('success', 'Thành công', `Đã gửi lời mời kết bạn tới ${targetUser.fullName || targetUser.username}`);

        // Bắn socket thông báo sự kiện add_contact
        if (socket && isConnected) {
          socket.emit('add_contact', {
            contactId: targetUser._id,
          });
        }

        // Ẩn người vừa kết bạn khỏi danh sách tìm kiếm
        setSearchResults((prev) => prev.filter((u) => u._id !== targetUser._id));
        setTotalUsers((prev) => Math.max(0, prev - 1));
        loadRequestsData();
      }
    } catch (err: any) {
      onToast('error', 'Lỗi', err.message || 'Gửi lời mời thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Chấp nhận lời mời
  const handleAcceptRequest = async (requestId: string, fromUser: IFriendUser) => {
    try {
      setActionLoadingId(requestId);
      const res = await friendService.acceptFriendRequest(fromUser._id || requestId);
      if (res.success) {
        onToast('success', 'Kết bạn thành công', `Bạn và ${fromUser.fullName || fromUser.username} đã trở thành bạn bè!`);

        // Bắn socket thông báo sự kiện accept_contact sang đối phương
        if (socket && isConnected) {
          socket.emit('accept_contact', {
            contactId: fromUser._id || requestId,
          });
        }

        // Xóa khỏi danh sách requests
        setFriendRequests((prev) => ({
          ...prev,
          received: prev.received.filter((r) => r._id !== requestId),
        }));
        setSearchResults((prev) => prev.filter((u) => u._id !== fromUser._id));
        setTotalUsers((prev) => Math.max(0, prev - 1));
        onFriendChange?.();
      }
    } catch (err: any) {
      onToast('error', 'Lỗi', err.message || 'Không thể chấp nhận lời mời');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Từ chối lời mời
  const handleRejectRequest = async (requestId: string, fromUser: IFriendUser) => {
    try {
      setActionLoadingId(requestId);
      const res = await friendService.rejectFriendRequest(fromUser._id || requestId);
      if (res.success) {
        onToast('info', 'Đã từ chối', `Đã từ chối lời mời từ ${fromUser.fullName || fromUser.username}`);
        setFriendRequests((prev) => ({
          ...prev,
          received: prev.received.filter((r) => r._id !== requestId),
        }));
        setSearchResults((prev) =>
          prev.map((u) => (u._id === fromUser._id ? { ...u, relationshipStatus: 'none' } : u))
        );
      }
    } catch (err: any) {
      onToast('error', 'Lỗi', err.message || 'Thao tác thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Hủy lời mời đã gửi
  const handleCancelSentRequest = async (requestId: string, targetUserId?: string) => {
    try {
      setActionLoadingId(requestId);
      const res = await friendService.cancelFriendRequest(requestId);
      if (res.success) {
        onToast('info', 'Đã hủy', 'Đã hủy lời mời kết bạn đã gửi');
        setFriendRequests((prev) => ({
          ...prev,
          sent: prev.sent.filter((r) => r._id !== requestId),
        }));
        if (targetUserId) {
          setSearchResults((prev) =>
            prev.map((u) => (u._id === targetUserId ? { ...u, relationshipStatus: 'none' } : u))
          );
        }
        // Bắn socket thông báo sự kiện add_contact
        if (socket && isConnected) {
          socket.emit('cancel_contact', {
            contactId: targetUserId,
          });
        }
      }
    } catch (err: any) {
      onToast('error', 'Lỗi', err.message || 'Thao tác thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mở khung trò chuyện với bạn bè
  const handleStartChatWith = (targetUser: IFriendUser) => {
    if (onStartChat) {
      onStartChat(targetUser);
    }
    onClose();
  };

  const pendingReceivedCount = friendRequests.received.length;

  return (
    <div className="friend-modal-backdrop" onClick={onClose}>
      <div className="friend-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="friend-modal-header">
          <div className="friend-modal-title-wrap">
            <div className="friend-title-icon-box">
              <UserPlus size={22} />
            </div>
            <div>
              <h3>Thêm bạn & Lời mời kết bạn</h3>
              <p>Tìm kiếm bạn bè mới và quản lý lời mời kết bạn</p>
            </div>
          </div>
          <button
            type="button"
            className="friend-modal-close-btn"
            onClick={onClose}
            title="Đóng modal (Esc)"
          >
            <X size={18} />
          </button>
        </header>

        {/* Navigation Tabs */}
        <nav className="friend-tabs-nav">
          <button
            type="button"
            className={`friend-tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={16} />
            <span>Tìm kiếm bạn mới</span>
          </button>

          <button
            type="button"
            className={`friend-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <Clock size={16} />
            <span>Lời mời kết bạn</span>
            {pendingReceivedCount > 0 && (
              <span className="tab-badge">{pendingReceivedCount}</span>
            )}
          </button>
        </nav>

        {/* Tab 1: Search & Add Friends */}
        {activeTab === 'search' && (
          <div className="friend-modal-content">
            <div className="friend-search-container">
              <Search size={18} className="friend-search-icon" />
              <input
                type="text"
                className="friend-search-input"
                placeholder="Nhập tên đăng nhập, họ tên, email hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="friend-search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    fetchUsersList('', 1);
                  }}
                  title="Xóa tìm kiếm"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Helper banner for API */}
            <div className="api-integration-banner">
              <Info size={16} />
              <span>
                API Đang dùng: <code>GET /api/v1/users/all-user?name=...&page=...&limit=10</code>
              </span>
            </div>

            {/* Header thống kê số lượng người dùng */}
            <div className="users-count-header">
              <span>
                {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}":` : 'Tất cả người dùng trên hệ thống:'}{' '}
                <b>{totalUsers} người</b>
              </span>
              {totalPage > 1 && (
                <span>Trang {page} / {totalPage}</span>
              )}
            </div>

            {/* Search Content */}
            {isSearching ? (
              <div className="friend-loading-box">
                <Loader2 size={28} className="spin-loader" />
                <span>Đang tải danh sách người dùng...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="friend-empty-state">
                <Search size={36} className="friend-empty-icon" />
                <h4>Không tìm thấy người dùng</h4>
                <p>
                  {searchQuery
                    ? `Không có người dùng nào khớp với từ khóa "${searchQuery}".`
                    : 'Chưa có người dùng nào khác trên hệ thống.'}
                </p>
              </div>
            ) : (
              <>
                <div className="friend-cards-list">
                  {searchResults.map((targetUser) => {
                    const isLoadingThis = actionLoadingId === targetUser._id;
                    const status = targetUser.relationshipStatus || 'none';

                    return (
                      <div key={targetUser._id} className="friend-user-card">
                        <div className="card-left-info">
                          <div className="card-avatar-wrapper">
                            {targetUser.avatar ? (
                              <img
                                src={targetUser.avatar}
                                alt={targetUser.username}
                                className="card-avatar-img"
                              />
                            ) : (
                              <div className="card-avatar-fallback">
                                {targetUser.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {targetUser.isOnline && <span className="card-online-dot" />}
                          </div>

                          <div className="card-details">
                            <div className="card-name-row">
                              <span className="card-fullname">
                                {targetUser.fullName || targetUser.username}
                              </span>
                              <span className="card-username">@{targetUser.username}</span>
                              {targetUser.gender && (
                                <span
                                  className={`user-gender-tag ${targetUser.gender.toLowerCase() === 'female'
                                    ? 'gender-female'
                                    : 'gender-male'
                                    }`}
                                >
                                  {targetUser.gender}
                                </span>
                              )}
                            </div>
                            {targetUser.bio && <p className="card-bio">{targetUser.bio}</p>}
                            <div className="card-contact-meta">
                              {targetUser.email && <span>{targetUser.email}</span>}
                              {targetUser.phone && <span>📞 {targetUser.phone}</span>}
                              {targetUser.address && <span>📍 {targetUser.address}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Action Button based on relationship status */}
                        <div className="card-actions-wrapper">
                          {status === 'none' && (
                            <button
                              type="button"
                              className="btn-friend-action btn-primary-add"
                              disabled={isLoadingThis}
                              onClick={() => handleSendFriendRequest(targetUser)}
                            >
                              {isLoadingThis ? (
                                <Loader2 size={15} className="spin-loader" />
                              ) : (
                                <UserPlus size={15} />
                              )}
                              <span>Kết bạn</span>
                            </button>
                          )}

                          {status === 'pending_sent' && (
                            <span className="status-badge-pending">
                              <Clock size={13} />
                              <span>Đã gửi lời mời</span>
                            </span>
                          )}

                          {status === 'pending_received' && (
                            <button
                              type="button"
                              className="btn-friend-action btn-accept-request"
                              onClick={() => setActiveTab('requests')}
                            >
                              <Clock size={15} />
                              <span>Xem lời mời</span>
                            </button>
                          )}

                          {status === 'friend' && (
                            <button
                              type="button"
                              className="btn-friend-action btn-chat-friend"
                              onClick={() => handleStartChatWith(targetUser)}
                            >
                              <MessageCircle size={15} />
                              <span>Nhắn tin</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Phân trang */}
                {totalPage > 1 && (
                  <div className="friend-pagination-row">
                    <button
                      type="button"
                      className="btn-pagination"
                      disabled={page <= 1 || isSearching}
                      onClick={() => fetchUsersList(searchQuery, page - 1)}
                    >
                      <ChevronLeft size={16} />
                      <span>Trang trước</span>
                    </button>
                    <span className="pagination-info">
                      Trang {page} / {totalPage} (Tổng {totalUsers} người)
                    </span>
                    <button
                      type="button"
                      className="btn-pagination"
                      disabled={page >= totalPage || isSearching}
                      onClick={() => fetchUsersList(searchQuery, page + 1)}
                    >
                      <span>Trang sau</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: Friend Requests */}
        {activeTab === 'requests' && (
          <div className="friend-modal-content">
            <div className="request-subtabs">
              <button
                type="button"
                className={`request-subtab-btn ${requestSubTab === 'received' ? 'active' : ''}`}
                onClick={() => setRequestSubTab('received')}
              >
                Đã nhận ({friendRequests.received.length})
              </button>
              <button
                type="button"
                className={`request-subtab-btn ${requestSubTab === 'sent' ? 'active' : ''}`}
                onClick={() => setRequestSubTab('sent')}
              >
                Đã gửi ({friendRequests.sent.length})
              </button>
            </div>

            {/* Helper banner for API */}
            <div className="api-integration-banner">
              <Info size={16} />
              <span>
                API Đang dùng: <code>GET /api/v1/users/request</code> & <code>PUT /api/v1/contacts/respone</code>
              </span>
            </div>

            {isLoadingRequests ? (
              <div className="friend-loading-box">
                <Loader2 size={28} className="spin-loader" />
                <span>Đang tải danh sách lời mời...</span>
              </div>
            ) : requestSubTab === 'received' ? (
              friendRequests.received.length === 0 ? (
                <div className="friend-empty-state">
                  <UserCheck size={36} className="friend-empty-icon" />
                  <h4>Không có lời mời kết bạn nào</h4>
                  <p>Khi có ai đó gửi lời mời cho bạn, danh sách sẽ hiển thị ở đây.</p>
                </div>
              ) : (
                <div className="friend-cards-list">
                  {friendRequests.received.map((req) => {
                    const sender = req.fromUser;
                    const isBusy = actionLoadingId === req._id;

                    return (
                      <div key={req._id} className="friend-user-card">
                        <div className="card-left-info">
                          <div className="card-avatar-wrapper">
                            {sender.avatar ? (
                              <img
                                src={sender.avatar}
                                alt={sender.username}
                                className="card-avatar-img"
                              />
                            ) : (
                              <div className="card-avatar-fallback">
                                {sender.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {sender.isOnline && <span className="card-online-dot" />}
                          </div>

                          <div className="card-details">
                            <div className="card-name-row">
                              <span className="card-fullname">
                                {sender.fullName || sender.username}
                              </span>
                              <span className="card-username">@{sender.username}</span>
                            </div>
                            {sender.bio && <p className="card-bio">{sender.bio}</p>}
                            <span className="card-contact-meta">Gửi {req.createdAt}</span>
                          </div>
                        </div>

                        <div className="card-actions-wrapper">
                          <button
                            type="button"
                            className="btn-friend-action btn-accept-request"
                            disabled={isBusy}
                            onClick={() => handleAcceptRequest(req._id, sender)}
                          >
                            {isBusy ? (
                              <Loader2 size={15} className="spin-loader" />
                            ) : (
                              <Check size={15} />
                            )}
                            <span>Chấp nhận</span>
                          </button>
                          <button
                            type="button"
                            className="btn-friend-action btn-reject-request"
                            disabled={isBusy}
                            onClick={() => handleRejectRequest(req._id, sender)}
                          >
                            <X size={15} />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : friendRequests.sent.length === 0 ? (
              <div className="friend-empty-state">
                <Clock size={36} className="friend-empty-icon" />
                <h4>Không có lời mời đã gửi</h4>
                <p>Bạn chưa gửi lời mời kết bạn nào đang chờ phê duyệt.</p>
              </div>
            ) : (
              <div className="friend-cards-list">
                {friendRequests.sent.map((req) => {
                  const target = req.toUser;
                  const isBusy = actionLoadingId === req._id;

                  return (
                    <div key={req._id} className="friend-user-card">
                      <div className="card-left-info">
                        <div className="card-avatar-wrapper">
                          {target.avatar ? (
                            <img
                              src={target.avatar}
                              alt={target.username}
                              className="card-avatar-img"
                            />
                          ) : (
                            <div className="card-avatar-fallback">
                              {target.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {target.isOnline && <span className="card-online-dot" />}
                        </div>

                        <div className="card-details">
                          <div className="card-name-row">
                            <span className="card-fullname">
                              {target.fullName || target.username}
                            </span>
                            <span className="card-username">@{target.username}</span>
                          </div>
                          <span className="card-contact-meta">Đã gửi {req.createdAt}</span>
                        </div>
                      </div>

                      <div className="card-actions-wrapper">
                        <button
                          type="button"
                          className="btn-friend-action btn-cancel-request"
                          disabled={isBusy}
                          onClick={() => handleCancelSentRequest(req._id, target._id)}
                        >
                          {isBusy ? (
                            <Loader2 size={15} className="spin-loader" />
                          ) : (
                            <X size={15} />
                          )}
                          <span>Hủy lời mời</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
