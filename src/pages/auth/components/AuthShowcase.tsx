import React from 'react';
import { MessageSquare, Zap, ShieldCheck, Radio } from 'lucide-react';

export const AuthShowcase: React.FC = () => {
  return (
    <aside className="auth-showcase">
      <div className="brand-header">
        <div className="brand-badge">
          <div className="brand-logo-icon">
            <MessageSquare size={24} />
          </div>
          <div className="brand-text-block">
            <h1 className="brand-title">OpenChat</h1>
            <span className="brand-tag">Realtime Platform</span>
          </div>
        </div>

        <div className="showcase-hero-content">
          <h2 className="showcase-heading">
            Trò chuyện không giới hạn, <br />
            <span className="gradient-text">kết nối tức thì.</span>
          </h2>
          <p className="showcase-desc">
            Trải nghiệm nhắn tin thời gian thực với tốc độ phản hồi cực nhanh, bảo mật đa tầng và giao diện hiện đại.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon-box">
                <Zap size={18} />
              </div>
              <div className="feature-texts">
                <h4>Độ trễ siêu thấp</h4>
                <p>Websocket & Socket.io truyền tải tin nhắn mili-giây</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <ShieldCheck size={18} />
              </div>
              <div className="feature-texts">
                <h4>Bảo mật thông tin</h4>
                <p>Mã hóa dữ liệu và kiểm soát quyền riêng tư tuyệt đối</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <Radio size={18} />
              </div>
              <div className="feature-texts">
                <h4>Trạng thái Online</h4>
                <p>Nhận biết bạn bè đang hoạt động & gửi thông báo tức thì</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="showcase-footer">
        <div className="avatar-stack">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" alt="Active user 1" />
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="Active user 2" />
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" alt="Active user 3" />
        </div>
        <p className="social-proof-text">
          Hơn <strong>2,500+</strong> người dùng đang trực tuyến
        </p>
      </div>
    </aside>
  );
};
