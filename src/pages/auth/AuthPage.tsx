import React, { useState } from 'react';
import { AuthShowcase, SocialAuthButtons, LoginForm, RegisterForm } from './components';
import { Toast, type ToastMessage } from '../../components/common';
import { authService } from '../../services';
import { useAuth } from '../../contexts';
import type { IAuthLogin, IAuthRegister } from '../../interfaces';
import './AuthPage.css';

export const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helpers
  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Tab switch
  const handleTabSwitch = (mode: 'login' | 'register') => {
    setAuthMode(mode);
  };

  // Social Auth Handlers
  const handleGoogleAuth = () => {
    setIsLoading(true);
    addToast('info', 'Google OAuth', 'Đang kết nối xác thực tài khoản Google...');
    setTimeout(() => {
      setIsLoading(false);
      addToast('success', 'Thành công', 'Đã liên kết và đăng nhập bằng Google!');
    }, 1200);
  };

  const handleFacebookAuth = () => {
    setIsLoading(true);
    addToast('info', 'Facebook Login', 'Đang kết nối xác thực Facebook...');
    setTimeout(() => {
      setIsLoading(false);
      addToast('success', 'Thành công', 'Đã liên kết và đăng nhập bằng Facebook!');
    }, 1200);
  };

  // Form Submissions
  const handleLoginSubmit = async (data: IAuthLogin) => {
    setIsLoading(true);
    try {
      const res = await login(data);
      console.log('res', res);
      addToast('success', 'Đăng nhập thành công', res.message || `Chào mừng ${data.email}!`);
    } catch (err: any) {
      addToast('error', 'Lỗi đăng nhập', err.message || 'Không thể đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (data: IAuthRegister) => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      addToast('success', 'Đăng ký thành công', res.message || 'Bạn có thể đăng nhập ngay bằng tài khoản vừa tạo.');
      setAuthMode('login');
    } catch (err: any) {
      addToast('error', 'Lỗi đăng ký', err.message || 'Không thể đăng ký tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-wrapper">
      {/* Background Ambience */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="ambient-glow-3" />

      {/* Notifications */}
      <Toast toasts={toasts} onClose={removeToast} />

      <div className="auth-container">
        {/* Left Showcase Banner */}
        <AuthShowcase />

        {/* Right Authentication Panel */}
        <section className="auth-panel">
          {/* Tab Selector */}
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              id="tab-login-btn"
              role="tab"
              aria-selected={authMode === 'login'}
              className={`tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              id="tab-register-btn"
              role="tab"
              aria-selected={authMode === 'register'}
              className={`tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('register')}
            >
              Đăng ký tài khoản
            </button>
          </div>

          <div className="form-header">
            <h2 className="form-title">
              {authMode === 'login' ? 'Chào mừng bạn trở lại! 👋' : 'Tạo tài khoản mới 🚀'}
            </h2>
            <p className="form-subtitle">
              {authMode === 'login'
                ? 'Nhập thông tin hoặc đăng nhập bằng tài khoản mạng xã hội'
                : 'Tham gia OpenChat để kết nối với bạn bè ngay hôm nay'}
            </p>
          </div>

          {/* Social Logins: Facebook & Google */}
          <SocialAuthButtons
            onGoogleClick={handleGoogleAuth}
            onFacebookClick={handleFacebookAuth}
            isLoading={isLoading}
          />

          <div className="auth-divider">
            <span>{authMode === 'login' ? 'Hoặc tiếp tục với email' : 'Hoặc đăng ký bằng email'}</span>
          </div>

          {/* Form Content */}
          {authMode === 'login' ? (
            <LoginForm
              onSubmit={handleLoginSubmit}
              isLoading={isLoading}
              onForgotPassword={() =>
                addToast('info', 'Quên mật khẩu', 'Vui lòng kiểm tra email khôi phục hoặc liên hệ admin!')
              }
            />
          ) : (
            <RegisterForm
              onSubmit={handleRegisterSubmit}
              isLoading={isLoading}
              onTermsClick={() =>
                addToast('info', 'Điều khoản', 'Điều khoản sử dụng và chính sách bảo mật của OpenChat.')
              }
            />
          )}

          {/* Switch Tab Prompt */}
          <div className="switch-view-prompt">
            {authMode === 'login' ? (
              <>
                Chưa có tài khoản OpenChat?
                <button
                  type="button"
                  id="switch-to-register-link"
                  className="switch-view-btn"
                  onClick={() => handleTabSwitch('register')}
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?
                <button
                  type="button"
                  id="switch-to-login-link"
                  className="switch-view-btn"
                  onClick={() => handleTabSwitch('login')}
                >
                  Đăng nhập ngay
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthPage;
