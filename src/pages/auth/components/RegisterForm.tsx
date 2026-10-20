import React, { useState } from 'react';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { InputField } from '../../../components/common';
import type { IAuthRegister } from '../../../interfaces';

interface RegisterFormProps {
  onSubmit: (data: IAuthRegister) => void;
  isLoading: boolean;
  onTermsClick: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  isLoading,
  onTermsClick,
}) => {
  const [formData, setFormData] = useState<IAuthRegister & { confirmPassword: string; agreeTerms: boolean }>({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength logic
  const calculateStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', classSuffix: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass) && pass.length >= 8) score++;

    if (score === 1) return { score: 1, label: 'Mật khẩu yếu', classSuffix: 'weak' };
    if (score === 2) return { score: 2, label: 'Mật khẩu trung bình', classSuffix: 'medium' };
    return { score: 3, label: 'Mật khẩu mạnh & an toàn', classSuffix: 'strong' };
  };

  const strength = calculateStrength(formData.password);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.username.trim()) {
      errs.username = 'Vui lòng nhập tên đăng nhập';
    } else if (formData.username.length < 3) {
      errs.username = 'Tên đăng nhập tối thiểu 3 ký tự';
    }

    if (!formData.email?.trim()) {
      errs.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errs.password = 'Mật khẩu cần tối thiểu 6 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = 'Bạn cần đồng ý với Điều khoản sử dụng';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const { username, password, email, phoneNumber, fullName } = formData;
      onSubmit({ username, password, email, phoneNumber, fullName });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form animate-fade-in" noValidate>
      <InputField
        id="register-username"
        name="username"
        label="Tên tài khoản (Username)"
        type="text"
        placeholder="vd: nguyenvana"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        icon={<User size={18} />}
        error={errors.username}
        required
        autoComplete="username"
        disabled={isLoading}
      />

      <InputField
        id="register-fullname"
        name="fullName"
        label="Họ và tên"
        type="text"
        placeholder="Nguyễn Văn A"
        value={formData.fullName || ''}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        icon={<User size={18} />}
        autoComplete="name"
        disabled={isLoading}
      />

      <InputField
        id="register-email"
        name="email"
        label="Địa chỉ Email"
        type="email"
        placeholder="ban@example.com"
        value={formData.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        icon={<Mail size={18} />}
        error={errors.email}
        required
        autoComplete="email"
        disabled={isLoading}
      />

      <InputField
        id="register-phone"
        name="phoneNumber"
        label="Số điện thoại (tùy chọn)"
        type="text"
        placeholder="0912 345 678"
        value={formData.phoneNumber || ''}
        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        icon={<Phone size={18} />}
        autoComplete="tel"
        disabled={isLoading}
      />

      <InputField
        id="register-password"
        name="password"
        label="Mật khẩu"
        type="password"
        placeholder="Tối thiểu 6 ký tự..."
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        icon={<Lock size={18} />}
        error={errors.password}
        required
        autoComplete="new-password"
        disabled={isLoading}
      />

      {formData.password && (
        <div className="strength-meter">
          <div className="strength-bars">
            <div className={`strength-bar ${strength.score >= 1 ? `active-${strength.classSuffix}` : ''}`} />
            <div className={`strength-bar ${strength.score >= 2 ? `active-${strength.classSuffix}` : ''}`} />
            <div className={`strength-bar ${strength.score >= 3 ? `active-${strength.classSuffix}` : ''}`} />
          </div>
          <span className="strength-label">{strength.label}</span>
        </div>
      )}

      <InputField
        id="register-confirm-password"
        name="confirmPassword"
        label="Xác nhận mật khẩu"
        type="password"
        placeholder="Nhập lại mật khẩu..."
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        icon={<Lock size={18} />}
        error={errors.confirmPassword}
        required
        autoComplete="new-password"
        disabled={isLoading}
      />

      <div className="form-extra-row">
        <label className="custom-checkbox-label">
          <input
            type="checkbox"
            id="terms-checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
            disabled={isLoading}
          />
          <span>
            Tôi đồng ý với{' '}
            <a
              href="#terms"
              className="terms-link"
              onClick={(e) => {
                e.preventDefault();
                onTermsClick();
              }}
            >
              Điều khoản & Dịch vụ
            </a>
          </span>
        </label>
      </div>
      {errors.agreeTerms && <p className="input-error-msg">{errors.agreeTerms}</p>}

      <button
        type="submit"
        id="register-submit-btn"
        className="submit-btn"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="spinner" />
            <span>Đang tạo tài khoản...</span>
          </>
        ) : (
          <>
            <span>Tạo tài khoản mới</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
};
