import apiClient from './api';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types';

const roleToNumber: Record<string, number> = {
  Admin: 0,
  Therapist: 1,
  Parent: 2,
};

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const payload = {
      ...data,
      role: roleToNumber[data.role as string] ?? 2,
    };
    const response = await apiClient.post<LoginResponse>('/auth/register', payload);
    return response.data;
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};
