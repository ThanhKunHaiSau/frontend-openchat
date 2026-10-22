import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/auth.service';
import type { IAuthLogin, IAuthResponse, IUser } from '../interfaces';

interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: IAuthLogin) => Promise<IAuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khôi phục thông tin user khi user F5 / refresh trang
  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      console.warn('Phiên đăng nhập hết hạn hoặc không hợp lệ:', error);
      authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Lắng nghe sự kiện logout khi refresh token hết hạn hoặc thất bại
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  const login = async (payload: IAuthLogin): Promise<IAuthResponse> => {
    const response = await authService.login(payload);
    if (response.success) {
      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (e) {
          console.error('Không thể lấy thông tin user sau khi login:', e);
        }
      }
    }
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (e) {
      console.error('Lỗi làm mới thông tin user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
