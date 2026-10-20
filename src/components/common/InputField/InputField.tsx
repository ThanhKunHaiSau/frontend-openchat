import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  error,
  required = false,
  autoComplete,
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-field-group ${error ? 'has-error' : ''}`}>
      <div className="input-label-row">
        <label htmlFor={id} className="input-label">
          {label} {required && <span className="required-star">*</span>}
        </label>
      </div>

      <div className="input-container">
        {icon && <div className="input-icon-left">{icon}</div>}

        <input
          id={id}
          name={name}
          type={effectiveType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`custom-input ${icon ? 'with-left-icon' : ''} ${isPassword ? 'with-right-icon' : ''}`}
        />

        {isPassword && (
          <button
            type="button"
            className="input-icon-right password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p className="input-error-msg">{error}</p>}
    </div>
  );
};
