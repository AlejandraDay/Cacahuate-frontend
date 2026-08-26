import apiClient from './api';
import type { LoginRequest, LoginResponse, RegisterRequest, AdminCreatedUser } from '../types';

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

  async adminCreateParent(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AdminCreatedUser> {
    const response = await apiClient.post<AdminCreatedUser>('/auth/admin/create-parent', {
      ...data,
      role: roleToNumber.Parent,
    });
    return response.data;
  },

  async adminCreateTherapist(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AdminCreatedUser> {
    const response = await apiClient.post<AdminCreatedUser>('/auth/admin/create-therapist', {
      ...data,
      role: roleToNumber.Therapist,
    });
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
