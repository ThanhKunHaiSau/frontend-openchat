import { apiClient } from './apiClient';
import type { IAuthLogin, IAuthRegister, IAuthResponse, IUser, IUpdateProfilePayload } from '../interfaces';

export const authService = {
  login: async (payload: IAuthLogin): Promise<IAuthResponse> => {
    const response = await apiClient.post<IAuthResponse>('/auth/login', payload);
    if (response.data.success && response.data.data?.accessToken) {
      localStorage.setItem('access_token', response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
      }
    }
    return response.data;
  },

  register: async (payload: IAuthRegister): Promise<IAuthResponse> => {
    const body = {
      username: payload.username,
      email: payload.email,
      password: payload.password,
      gender: payload.gender,
      phone: payload.phoneNumber,
    };
    const response = await apiClient.post<IAuthResponse>('/auth/register', body);
    return response.data;
  },

  loginWithFacebook: async (fbAccessToken: string): Promise<IAuthResponse> => {
    const response = await apiClient.post<IAuthResponse>('/auth/facebook', { accessToken: fbAccessToken });
    if (response.data.success && response.data.data?.accessToken) {
      localStorage.setItem('access_token', response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
      }
    }
    return response.data;
  },

  loginWithGoogle: async (googleAccessToken: string): Promise<IAuthResponse> => {
    const response = await apiClient.post<IAuthResponse>('/auth/google', { accessToken: googleAccessToken });
    if (response.data.success && response.data.data?.accessToken) {
      localStorage.setItem('access_token', response.data.data.accessToken);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
      }
    }
    return response.data;
  },

  getMe: async (): Promise<IUser> => {
    const response = await apiClient.get<{ success: boolean; data: IUser; message?: string }>('/auth/me');
    return response.data.data;
  },

  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('Không tìm thấy refresh token');
    }
    const response = await apiClient.post<{ success: boolean; data: { accessToken: string } }>(
      '/auth/refresh-token',
      { refreshToken }
    );
    const newAccessToken = response.data.data.accessToken;
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Lỗi gọi API logout phía server:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  verifyEmail: async (token: string): Promise<any> => {
    const response = await apiClient.get<{ success: boolean; data: any; message?: string }>(
      `/auth/verify-email/${token}`
    );
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ success: boolean; data: { avatar: string; user?: IUser }; message?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.put<{ success: boolean; data: { avatar: string; user?: IUser }; message?: string }>(
      '/auth/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  updateProfile: async (payload: IUpdateProfilePayload): Promise<{ success: boolean; data: IUser; message?: string }> => {
    const response = await apiClient.put<{ success: boolean; data: IUser; message?: string }>(
      '/auth/profile',
      payload
    );
    return response.data;
  },
};

