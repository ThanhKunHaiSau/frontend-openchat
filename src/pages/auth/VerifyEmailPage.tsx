import React, { useEffect, useState, useRef } from 'react';
import { authService } from '../../services';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Đang xác thực tài khoản của bạn...');
  const [countdown, setCountdown] = useState<number>(3);
  const isCalledRef = useRef(false);

  useEffect(() => {
    // Ngăn chặn React 18/19 StrictMode tự động gọi useEffect 2 lần trên môi trường dev
    if (isCalledRef.current) return;
    isCalledRef.current = true;

    // Lấy token từ URL path: /verify-email/:token hoặc query param: ?token=...
    const pathname = window.location.pathname;
    const match = pathname.match(/\/verify-email\/(.+)/);
    const token = match ? match[1] : new URLSearchParams(window.location.search).get('token');

    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy token xác thực trong đường dẫn.');
      return;
    }

    const doVerify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.');
      } catch (err: any) {
        setStatus('error');
        const errText = err.response?.data?.message || err.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.';
        setMessage(errText);
      }
    };

    doVerify();
  }, []);

  // Tự động đếm ngược và redirect về login khi thành công
  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div style={styles.container}>
      {/* Background glow effects */}
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={styles.card}>
        {/* Brand Logo */}
        <div style={styles.logo}>
          <span style={styles.logoText}>⚡ Open</span>
          <span style={styles.logoAccent}>Chat</span>
        </div>

        {/* Status Icon & Content */}
        {status === 'loading' && (
          <div style={styles.statusBox}>
            <div style={styles.spinnerWrapper}>
              <Loader2 size={46} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={styles.title}>Đang xác thực email</h2>
            <p style={styles.desc}>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div style={styles.statusBox}>
            <div style={styles.successIconWrapper}>
              <CheckCircle2 size={54} color="#10b981" />
            </div>
            <h2 style={{ ...styles.title, color: '#10b981' }}>Kích hoạt thành công! 🎉</h2>
            <p style={styles.desc}>{message}</p>
            <p style={styles.redirectNotice}>
              Tự động chuyển về trang đăng nhập sau <strong style={{ color: '#818cf8' }}>{countdown}s</strong>...
            </p>
            <button style={styles.btnPrimary} onClick={handleGoHome}>
              <span>Đăng nhập ngay</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.statusBox}>
            <div style={styles.errorIconWrapper}>
              <XCircle size={54} color="#ef4444" />
            </div>
            <h2 style={{ ...styles.title, color: '#ef4444' }}>Xác thực thất bại</h2>
            <p style={styles.desc}>{message}</p>
            <button style={styles.btnSecondary} onClick={handleGoHome}>
              <span>Quay về trang đăng nhập</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0e17',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  },
  glowTop: {
    position: 'absolute',
    top: '-15%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  glowBottom: {
    position: 'absolute',
    bottom: '-20%',
    right: '10%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(217, 70, 239, 0.12) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '460px',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '42px 32px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
  },
  logo: {
    marginBottom: '28px',
  },
  logoText: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.03em',
  },
  logoAccent: {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#a855f7',
    letterSpacing: '-0.03em',
  },
  statusBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  spinnerWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  successIconWrapper: {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  errorIconWrapper: {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: '0 0 10px',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#f9fafb',
    letterSpacing: '-0.02em',
  },
  desc: {
    margin: '0 0 20px',
    fontSize: '0.95rem',
    color: '#9ca3af',
    lineHeight: 1.6,
  },
  redirectNotice: {
    margin: '0 0 24px',
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '13px 28px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
    transition: 'all 0.2s ease',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    border: '1px solid #374151',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '0.92rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
