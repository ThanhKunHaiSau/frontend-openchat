import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

/**
 * Socket client instance singleton
 * Thiết lập autoConnect: false để kiểm soát việc kết nối khi đã xác thực người dùng
 */
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  // Socket.IO v4 hỗ trợ hàm auth callback, tự động lấy token mới nhất mỗi khi kết nối/reconnect
  auth: (cb) => {
    const token = localStorage.getItem('access_token');
    cb({ token });
  },
});

/**
 * Hàm kết nối socket thủ công với auth tuỳ chọn
 */
export const connectSocket = (extraAuth?: Record<string, any>) => {
  if (extraAuth) {
    socket.auth = {
      ...(typeof socket.auth === 'object' ? socket.auth : {}),
      token: localStorage.getItem('access_token'),
      ...extraAuth,
    };
  }
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Hàm ngắt kết nối socket khi logout
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const socketService = {
  socket,
  connect: connectSocket,
  disconnect: disconnectSocket,
};

export default socketService;

