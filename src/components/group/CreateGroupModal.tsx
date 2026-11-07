import React, { useState, useMemo } from 'react';
import { Users, X, Search, Check, Loader2 } from 'lucide-react';
import { chatService } from '../../services';
import { useSocket } from '../../contexts';
import type { IFriendUser, IChatConversation } from '../../interfaces';
import './CreateGroupModal.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: IFriendUser[];
  onGroupCreated: (newConv: IChatConversation) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  friends,
  onGroupCreated,
  onToast,
}) => {
  const { socket } = useSocket();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lọc bạn bè theo từ khóa tìm kiếm
  const filteredFriends = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.username.toLowerCase().includes(q) ||
        (f.fullName && f.fullName.toLowerCase().includes(q))
    );
  }, [friends, searchQuery]);

  // Danh sách bạn bè đã chọn
  const selectedFriends = useMemo(() => {
    return friends.filter((f) => selectedIds.has(f._id));
  }, [friends, selectedIds]);

  // Chọn / Bỏ chọn bạn bè
  const toggleSelectFriend = (friendId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) {
        next.delete(friendId);
      } else {
        next.add(friendId);
      }
      return next;
    });
  };

  // Reset form và đóng modal
  const handleClose = () => {
    setGroupName('');
    setSearchQuery('');
    setSelectedIds(new Set());
    onClose();
  };

  // Xử lý tạo nhóm
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedIds.size === 0) {
      onToast('error', 'Chưa chọn thành viên', 'Vui lòng chọn ít nhất 1 bạn bè để tạo nhóm.');
      return;
    }

    try {
      setIsSubmitting(true);
      const memberIds = Array.from(selectedIds);
      const finalName = groupName.trim() || undefined;

      const newGroup = await chatService.createGroup(memberIds, finalName);
      if (newGroup) {
        // Bắn Socket add_group để server gửi thông báo tức thì đến các thành viên được thêm
        if (socket) {
          socket.emit('add_group', {
            conversationId: newGroup._id,
            memberIds,
          });
        }

        onToast(
          'success',
          'Tạo nhóm thành công 🎉',
          `Đã tạo nhóm trò chuyện "${newGroup.name || 'Nhóm mới'}"!`
        );
        onGroupCreated(newGroup);
        handleClose();
      }
    } catch (err: any) {
      console.error('Lỗi khi tạo nhóm:', err);
      onToast(
        'error',
        'Lỗi tạo nhóm',
        err.response?.data?.message || err.message || 'Không thể tạo nhóm trò chuyện'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="group-modal-backdrop" onClick={handleClose}>
      <div className="group-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="group-modal-header">
          <div className="group-modal-title-wrap">
            <div className="group-title-icon-box">
              <Users size={20} />
            </div>
            <div>
              <h3>Tạo nhóm trò chuyện</h3>
              <p>Trò chuyện và chia sẻ tệp cùng lúc với nhiều bạn bè</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-close-group-modal"
            onClick={handleClose}
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup}>
          {/* Tên nhóm */}
          <div className="group-input-group">
            <label className="group-input-label">Tên nhóm trò chuyện</label>
            <div className="group-text-input-wrap">
              <Users size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Nhập tên nhóm (ví dụ: Team Dự Án, Bạn Thân...)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Tìm kiếm bạn bè */}
          <div className="group-input-group">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
              }}
            >
              <label className="group-input-label" style={{ margin: 0 }}>
                Chọn thành viên
              </label>
              <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                Đã chọn: {selectedIds.size} người
              </span>
            </div>
            <div className="group-text-input-wrap">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Tìm bạn bè theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Chips thành viên đã chọn */}
          {selectedFriends.length > 0 && (
            <div className="group-selected-bar">
              {selectedFriends.map((f) => (
                <div key={f._id} className="selected-friend-chip">
                  <img
                    src={
                      f.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={f.username}
                    className="chip-avatar"
                  />
                  <span>{(f.fullName || f.username).split(' ')[0]}</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => toggleSelectFriend(f._id)}
                    title="Xóa"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Danh sách bạn bè để chọn */}
          <div className="group-friends-list">
            {filteredFriends.length === 0 ? (
              <div className="group-no-friends">
                {friends.length === 0
                  ? 'Bạn chưa có người bạn nào để thêm vào nhóm.'
                  : 'Không tìm thấy bạn bè phù hợp.'}
              </div>
            ) : (
              filteredFriends.map((f) => {
                const isSelected = selectedIds.has(f._id);
                return (
                  <div
                    key={f._id}
                    className={`group-friend-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelectFriend(f._id)}
                  >
                    <div className="friend-row-left">
                      <div className="friend-row-avatar-box">
                        <img
                          src={
                            f.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={f.username}
                        />
                        {f.isOnline && <span className="friend-row-online-dot" />}
                      </div>
                      <div>
                        <div className="friend-row-name">{f.fullName || f.username}</div>
                        <div className="friend-row-subtext">@{f.username}</div>
                      </div>
                    </div>

                    <div className="friend-checkbox">
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="group-modal-footer">
            <button
              type="button"
              className="btn-group-cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-group-submit"
              disabled={selectedIds.size === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-loader" />
                  <span>Đang tạo nhóm...</span>
                </>
              ) : (
                <>
                  <Users size={16} />
                  <span>Tạo nhóm ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;

