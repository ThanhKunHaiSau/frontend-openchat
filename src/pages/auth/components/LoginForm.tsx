import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import { InputField } from '../../../components/common';
import type { IAuthLogin } from '../../../interfaces';

interface LoginFormProps {
  onSubmit: (data: IAuthLogin) => void;
  isLoading: boolean;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  onForgotPassword,
}) => {
  const [formData, setFormData] = useState<IAuthLogin>({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.email.trim()) {
      errs.email = 'Vui lòng nhập tên tài khoản hoặc email';
    }
    if (!formData.password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errs.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form animate-fade-in" noValidate>
      <InputField
        id="login-username"
        name="username"
        label="Tên đăng nhập hoặc Email"
        type="text"
        placeholder="Nhập tên đăng nhập..."
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        icon={<User size={18} />}
        error={errors.username}
        required
        autoComplete="username"
        disabled={isLoading}
      />

      <InputField
        id="login-password"
        name="password"
        label="Mật khẩu"
        type="password"
        placeholder="Nhập mật khẩu..."
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        icon={<Lock size={18} />}
        error={errors.password}
        required
        autoComplete="current-password"
        disabled={isLoading}
      />

      <div className="form-extra-row">
        <label className="custom-checkbox-label">
          <input
            type="checkbox"
            id="remember-me-checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <span>Ghi nhớ đăng nhập</span>
        </label>
        <a
          href="#forgot"
          className="forgot-link"
          onClick={(e) => {
            e.preventDefault();
            onForgotPassword();
          }}
        >
          Quên mật khẩu?
        </a>
      </div>

      <button
        type="submit"
        id="login-submit-btn"
        className="submit-btn"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="spinner" />
            <span>Đang xác thực...</span>
          </>
        ) : (
          <>
            <span>Đăng nhập ngay</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
};
