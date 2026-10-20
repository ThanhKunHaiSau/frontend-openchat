import React from 'react';
import { AuthPage } from '../pages/auth';

/**
 * AppRouter: Quản lý điều hướng toàn bộ ứng dụng
 * Dễ dàng mở rộng thêm các màn hình sau này (ChatPage, ProfilePage...)
 */
export const AppRouter: React.FC = () => {
  // Hiện tại hiển thị AuthPage làm trang mặc định
  return <AuthPage />;
};
