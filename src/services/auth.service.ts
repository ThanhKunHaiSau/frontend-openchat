import { apiClient } from './apiClient';
import type { IAuthLogin, IAuthRegister, IAuthResponse } from '../interfaces';

export const authService = {
  login: async (payload: IAuthLogin): Promise<IAuthResponse> => {
    const response = await apiClient.post<IAuthResponse>('/auth/login', payload);
    if (response.data.success) {
      localStorage.setItem("access_token", response.data.data?.accessToken);
      localStorage.setItem("refresh_token", response.data.data?.refreshToken);
    }
    return response.data;
  },

  register: async (payload: IAuthRegister): Promise<IAuthResponse> => {
    const response = await apiClient.post<IAuthResponse>('/auth/register', payload);
    return response.data;
  },
};
