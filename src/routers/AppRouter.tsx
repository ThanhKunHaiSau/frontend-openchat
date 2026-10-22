import React from 'react';
import { useAuth } from '../contexts';
import { AuthPage } from '../pages/auth';
import { ChatPage } from '../pages/chat';

export const AppRouter: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Hiển thị splash/loading trong lúc verify token khi mới refresh web
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <div style={styles.logoText}>
            <span>⚡ Open</span>
            <span style={styles.logoAccent}>Chat</span>
          </div>
          <p style={styles.loadingSub}>Đang khôi phục phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Nếu đã đăng nhập thành công và có thông tin user -> vào màn hình Chat
  if (isAuthenticated && user) {
    return <ChatPage />;
  }

  // Mặc định: trang Đăng nhập / Đăng ký
  return <AuthPage />;
};

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0e17',
    color: '#f8fafc',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  loadingCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  spinner: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: '3px solid rgba(99, 102, 241, 0.15)',
    borderTopColor: '#6366f1',
    animation: 'spin 0.8s linear infinite',
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  logoAccent: {
    color: '#8b5cf6',
  },
  loadingSub: {
    fontSize: '0.875rem',
    color: '#94a3b8',
  },
};
