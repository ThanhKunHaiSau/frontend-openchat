import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Quản lý trạng thái và hàng đợi refresh token để tránh gọi API refresh nhiều lần cùng lúc
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token refresh and errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Không can thiệp nếu lỗi không phải 401, hoặc request là route login/refresh-token, hoặc request này đã từng retry rồi
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
      // Nếu đang trong quá trình refresh token, cho request này vào hàng đợi chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      // Nếu không có refresh token -> xóa phiên và phát sự kiện logout
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'));
      }

      try {
        // Dùng axios riêng (không qua apiClient để tránh bị interceptor lặp vô tận)
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = response.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('Không nhận được accessToken mới từ máy chủ');
        }

        // 1. Lưu token mới vào LocalStorage
        localStorage.setItem('access_token', newAccessToken);

        // 2. Gắn token mới cho các request sau
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 3. Giải phóng toàn bộ các request đang chờ trong queue
        processQueue(null, newAccessToken);

        // 4. Thực hiện lại request ban đầu với access token mới
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token cũng hết hạn hoặc không hợp lệ -> Logout
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'));
      } finally {
        isRefreshing = false;
      }
    }

    console.log('Dữ liệu lỗi từ Backend:', error.response?.data);
    const message = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
    return Promise.reject(new Error(message));
  }
);
