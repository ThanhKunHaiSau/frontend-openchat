import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onClose }) => {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({
  toast,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle2 size={20} className="toast-icon-success" />,
    error: <AlertCircle size={20} className="toast-icon-error" />,
    info: <Info size={20} className="toast-icon-info" />,
  };

  return (
    <div className={`toast-card toast-${toast.type} animate-fade-in`}>
      <div className="toast-icon">{icons[toast.type]}</div>
      <div className="toast-content">
        <h4 className="toast-title">{toast.title}</h4>
        <p className="toast-text">{toast.message}</p>
      </div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={() => onClose(toast.id)}
        aria-label="Đóng thông báo"
      >
        <X size={16} />
      </button>
    </div>
  );
};
