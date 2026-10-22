import React from 'react';
import { useAuth } from '../../contexts';
import {
  LogOut,
  RotateCw,
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Flame,
} from 'lucide-react';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="home-wrapper">
      {/* Background Ambience */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Top Navigation */}
      <header className="home-header">
        <div className="header-left">
          <div className="brand-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">
              Open<span className="logo-accent">Chat</span>
            </span>
          </div>
          <span className="badge-online">
            <span className="dot-pulse" />
            Đang hoạt động
          </span>
        </div>

        <div className="header-right">
          <div className="user-pill">
            <div className="user-avatar-small">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-pill-info">
              <span className="pill-username">{user?.username || 'Người dùng'}</span>
              <span className="pill-role">{user?.role || 'User'}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-logout"
            onClick={logout}
            title="Đăng xuất khỏi tài khoản"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="home-container">
        {/* Welcome Hero */}
        <section className="welcome-card">
          <div className="welcome-badge">
            <Sparkles size={16} />
            <span>Xác thực thành công</span>
          </div>
          <h1 className="welcome-title">
            Xin chào, <span className="highlight-name">{user?.username || 'Bạn'}</span>! 👋
          </h1>
          <p className="welcome-desc">
            Bạn đã đăng nhập thành công vào hệ thống <strong>OpenChat</strong>. Phiên làm việc của bạn được lưu trữ an toàn trong trình duyệt và đồng bộ tức thời với Redis cache backend.
          </p>
        </section>

        {/* Refresh Testing Banner */}
        <section className="refresh-banner">
          <div className="banner-icon-box">
            <RotateCw className="spinning-icon" size={24} />
          </div>
          <div className="banner-text">
            <h3>Kiểm tra tính năng F5 (Refresh trang)</h3>
            <p>
              Khi bạn bấm <strong>F5</strong> hoặc tải lại trang web, Frontend sẽ tự động đọc token và gọi API <code>GET /api/v1/auth/me</code> để khôi phục phiên đăng nhập mà không bị mất dữ liệu!
            </p>
          </div>
          <button type="button" className="btn-test-reload" onClick={handleReload}>
            <RotateCw size={16} />
            <span>F5 thử ngay</span>
          </button>
        </section>

        {/* User Profile Card */}
        <div className="details-grid">
          <div className="info-card">
            <div className="card-header">
              <div className="card-title-group">
                <User size={18} className="card-icon" />
                <h3>Thông tin người dùng đang đăng nhập</h3>
              </div>
              <span className="tag-verified">
                <CheckCircle2 size={14} />
                Đã xác thực
              </span>
            </div>

            <div className="info-rows">
              <div className="info-row">
                <span className="info-label">
                  <User size={14} /> Tên người dùng:
                </span>
                <span className="info-value username-val">{user?.username || 'N/A'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  <Mail size={14} /> Email:
                </span>
                <span className="info-value">{user?.email || 'N/A'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  <ShieldCheck size={14} /> Vai trò (Role):
                </span>
                <span className="info-badge role-badge">{user?.role || 'EU'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  <Flame size={14} /> Giới tính:
                </span>
                <span className="info-value">{user?.gender || 'Chưa cập nhật'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">
                  <MessageSquare size={14} /> User ID:
                </span>
                <span className="info-value mono-val">{user?.userId || user?._id || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="info-card architectural-card">
            <div className="card-header">
              <div className="card-title-group">
                <Sparkles size={18} className="card-icon" />
                <h3>Cơ chế hoạt động khi Refresh</h3>
              </div>
            </div>

            <div className="flow-steps">
              <div className="flow-step">
                <div className="step-num">1</div>
                <div className="step-content">
                  <strong>Khởi tạo ứng dụng</strong>
                  <p><code>AuthProvider</code> chạy hook <code>useEffect</code> kiểm tra <code>access_token</code> trong <code>localStorage</code>.</p>
                </div>
              </div>

              <div className="flow-step">
                <div className="step-num">2</div>
                <div className="step-content">
                  <strong>Gọi API xác thực</strong>
                  <p>Gửi request <code>GET /api/v1/auth/me</code> kèm Bearer token qua Axios Interceptor.</p>
                </div>
              </div>

              <div className="flow-step">
                <div className="step-num">3</div>
                <div className="step-content">
                  <strong>Xác thực tốc độ cao</strong>
                  <p>Backend giải mã JWT và lấy user trực tiếp từ <strong>Redis Cache (&lt; 1ms)</strong> trả về cho Frontend.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
