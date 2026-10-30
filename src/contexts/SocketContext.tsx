import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { socket, connectSocket, disconnectSocket } from '../services/socket.service';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);

  useEffect(() => {
    // Chỉ kết nối socket khi người dùng đã đăng nhập thành công
    if (isAuthenticated && user) {
      const userId = user._id || user.userId;
      connectSocket({ userId });

      const onConnect = () => {
        console.log('⚡ [Socket.IO] Đã kết nối tới server:', socket.id);
        setIsConnected(true);
      };

      const onDisconnect = (reason: string) => {
        console.log('🔌 [Socket.IO] Đã ngắt kết nối:', reason);
        setIsConnected(false);
      };

      const onConnectError = (error: Error) => {
        console.error('❌ [Socket.IO] Lỗi kết nối:', error.message);
        setIsConnected(false);
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onConnectError);

      // Nếu socket đã kết nối trước đó
      if (socket.connected) {
        setIsConnected(true);
      }

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onConnectError);
      };
    } else {
      // Khi logout hoặc chưa đăng nhập thì ngắt kết nối
      disconnectSocket();
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook truy cập socket instance và trạng thái kết nối
 */
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket phải được sử dụng bên trong SocketProvider');
  }
  return context;
};

/**
 * Hook tiện ích để lắng nghe sự kiện từ Socket.IO
 * Tự động đăng ký và huỷ đăng ký (clean up) khi component unmount,
 * tránh tình trạng nhận tin nhắn/sự kiện bị lặp nhiều lần.
 *
 * @param event Tên sự kiện (ví dụ: "receive_message", "user_online")
 * @param callback Hàm xử lý khi nhận được sự kiện
 */
export const useSocketEvent = <T = any>(
  event: string,
  callback: (data: T) => void
) => {
  const { socket } = useSocket();
  const savedHandler = useRef(callback);

  useEffect(() => {
    savedHandler.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket || !event) return;

    const eventListener = (data: T) => {
      savedHandler.current(data);
    };

    socket.on(event, eventListener);

    return () => {
      socket.off(event, eventListener);
    };
  }, [socket, event]);
};

