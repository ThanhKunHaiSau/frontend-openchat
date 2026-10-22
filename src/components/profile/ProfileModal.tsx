import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts';
import { authService } from '../../services/auth.service';
import {
  X,
  Camera,
  User,
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
  Check,
  Loader2,
  Upload,
} from 'lucide-react';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Đồng bộ dữ liệu khi mở modal hoặc khi user thay đổi
  useEffect(() => {
    if (user && isOpen) {
      setUsername(user.username || '');
      setGender(user.gender || 'Male');
      setPhone(user.phone !== null && user.phone !== undefined ? String(user.phone) : '');
      setAddress(user.address || '');
      setAvatarPreview(user.avatar || null);
      setSelectedFile(null);
    }
  }, [user, isOpen]);

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Xử lý khi chọn file ảnh từ máy
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng
    if (!file.type.startsWith('image/')) {
      onToast('error', 'Tệp không hợp lệ', 'Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP)!');
      return;
    }

    // Kiểm tra dung lượng (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onToast('error', 'Ảnh quá lớn', 'Kích thước ảnh tối đa cho phép là 5MB!');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  // Upload ảnh đại diện lên Cloudinary
  const handleUploadAvatar = async () => {
    if (!selectedFile) return;

    try {
      setIsUploadingAvatar(true);
      const res = await authService.uploadAvatar(selectedFile);
      if (res.success && res.data?.avatar) {
        // Cập nhật thông tin user trong context
        updateUser({
          avatar: res.data.avatar,
          ...(res.data.user || {}),
        });
        setAvatarPreview(res.data.avatar);
        setSelectedFile(null);
        onToast('success', 'Thành công', 'Cập nhật ảnh đại diện thành công!');
      } else {
        onToast('error', 'Lỗi', res.message || 'Không thể cập nhật ảnh đại diện!');
      }
    } catch (err: any) {
      console.error('Lỗi upload avatar:', err);
      const msg = err.response?.data?.message || err.message || 'Tải ảnh thất bại!';
      onToast('error', 'Lỗi tải ảnh', msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Hủy ảnh đang chọn xem trước
  const handleCancelSelectedFile = () => {
    setSelectedFile(null);
    setAvatarPreview(user?.avatar || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Lưu thông tin cá nhân
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      onToast('error', 'Thiếu thông tin', 'Vui lòng nhập tên hiển thị!');
      return;
    }

    try {
      setIsSavingProfile(true);

      // Nếu đang có file ảnh mới chưa bấm tải lên, upload luôn
      let latestAvatar = user?.avatar;
      if (selectedFile) {
        try {
          const avatarRes = await authService.uploadAvatar(selectedFile);
          if (avatarRes.success && avatarRes.data?.avatar) {
            latestAvatar = avatarRes.data.avatar;
            setSelectedFile(null);
          }
        } catch (avatarErr) {
          console.warn('Lỗi upload avatar đồng thời:', avatarErr);
        }
      }

      const res = await authService.updateProfile({
        username: username.trim(),
        gender,
        phone: phone.trim() ? phone.trim() : null,
        address: address.trim(),
      });

      if (res.success) {
        updateUser({
          ...res.data,
          ...(latestAvatar ? { avatar: latestAvatar } : {}),
        });
        onToast('success', 'Thành công', 'Cập nhật thông tin cá nhân thành công!');
        onClose();
      } else {
        onToast('error', 'Thất bại', res.message || 'Cập nhật thông tin thất bại!');
      }
    } catch (err: any) {
      console.error('Lỗi cập nhật profile:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể cập nhật thông tin!';
      onToast('error', 'Lỗi', msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div
        className="profile-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Header */}
        <div className="profile-modal-header">
          <div className="profile-modal-title-wrap">
            <h3 id="profile-modal-title">Hồ sơ cá nhân</h3>
            <p>Quản lý ảnh đại diện và thông tin tài khoản của bạn</p>
          </div>
          <button
            type="button"
            className="profile-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
            style={{ display: 'none' }}
          />

          <div
            className="avatar-upload-wrapper"
            onClick={() => fileInputRef.current?.click()}
            title="Nhấn để đổi ảnh đại diện"
          >
            <div className="avatar-image-ring">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user?.username || 'Avatar'}
                  className="avatar-image-preview"
                />
              ) : (
                <div className="avatar-fallback-initial">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>

            <div className="avatar-hover-overlay">
              <Camera size={22} />
              <span>Đổi ảnh</span>
            </div>

            <div className="avatar-badge-camera">
              {isUploadingAvatar ? (
                <Loader2 size={16} className="spinner-icon" />
              ) : (
                <Camera size={15} />
              )}
            </div>
          </div>

          <span className="avatar-hint-text">
            Khuyến nghị ảnh vuông, định dạng JPG, PNG hoặc WebP (tối đa 5MB)
          </span>

          {/* Quick upload buttons if a new file is chosen */}
          {selectedFile && (
            <div className="avatar-pending-actions">
              <button
                type="button"
                className="btn-upload-avatar-now"
                onClick={handleUploadAvatar}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 size={14} className="spinner-icon" />
                    Đang lưu ảnh...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Lưu ảnh đại diện ngay
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn-cancel-avatar-file"
                onClick={handleCancelSelectedFile}
                disabled={isUploadingAvatar}
              >
                Hủy
              </button>
            </div>
          )}
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSubmitProfile} className="profile-form">
          {/* Email (Readonly) */}
          <div className="profile-input-group">
            <label className="profile-input-label">
              <Mail size={14} />
              <span>Email tài khoản</span>
            </label>
            <div className="profile-input-wrapper">
              <Mail size={16} className="profile-input-icon" />
              <input
                type="text"
                value={user?.email || 'Chưa cập nhật'}
                disabled
                className="profile-input-field"
              />
              <span className="badge-verified-email">
                <ShieldCheck size={12} />
                Đã xác thực
              </span>
            </div>
          </div>

          {/* Username & Gender Row */}
          <div className="form-grid-2">
            <div className="profile-input-group">
              <label className="profile-input-label">
                <User size={14} />
                <span>Tên hiển thị</span>
              </label>
              <div className="profile-input-wrapper">
                <User size={16} className="profile-input-icon" />
                <input
                  type="text"
                  placeholder="Nhập tên hiển thị"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="profile-input-field"
                  required
                />
              </div>
            </div>

            <div className="profile-input-group">
              <label className="profile-input-label">
                <span>Giới tính</span>
              </label>
              <div className="gender-pills-row">
                <button
                  type="button"
                  className={`gender-pill-btn ${gender === 'Male' ? 'active' : ''}`}
                  onClick={() => setGender('Male')}
                >
                  {gender === 'Male' && <Check size={14} />}
                  Nam
                </button>
                <button
                  type="button"
                  className={`gender-pill-btn ${gender === 'Female' ? 'active' : ''}`}
                  onClick={() => setGender('Female')}
                >
                  {gender === 'Female' && <Check size={14} />}
                  Nữ
                </button>
              </div>
            </div>
          </div>

          {/* Phone & Address Row */}
          <div className="form-grid-2">
            <div className="profile-input-group">
              <label className="profile-input-label">
                <Phone size={14} />
                <span>Số điện thoại</span>
              </label>
              <div className="profile-input-wrapper">
                <Phone size={16} className="profile-input-icon" />
                <input
                  type="tel"
                  placeholder="Ví dụ: 0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="profile-input-field"
                />
              </div>
            </div>

            <div className="profile-input-group">
              <label className="profile-input-label">
                <MapPin size={14} />
                <span>Địa chỉ</span>
              </label>
              <div className="profile-input-wrapper">
                <MapPin size={16} className="profile-input-icon" />
                <input
                  type="text"
                  placeholder="Ví dụ: Hà Nội, Việt Nam"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="profile-input-field"
                />
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div className="profile-role-tag">
            <ShieldCheck size={14} />
            <span>Vai trò: {user?.role === 'EU' ? 'Thành viên (EU)' : user?.role || 'Thành viên'}</span>
          </div>

          {/* Action Buttons */}
          <div className="profile-modal-actions">
            <button
              type="button"
              className="btn-profile-cancel"
              onClick={onClose}
              disabled={isSavingProfile || isUploadingAvatar}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-profile-save"
              disabled={isSavingProfile || isUploadingAvatar}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 size={16} className="spinner-icon" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
