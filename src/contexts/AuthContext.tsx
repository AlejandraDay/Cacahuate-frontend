import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import type { AuthContextType, User, RegisterRequest } from '../types';

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
};

const extractUserId = (token: string): string => {
  const payload = decodeJwtPayload(token);
  return (
    (payload.sub as string) ||
    (payload.nameid as string) ||
    (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string) ||
    ''
  );
};

const isTokenExpired = (token: string): boolean => {
  const { exp } = decodeJwtPayload(token);
  if (!exp) return true;
  return (exp as number) * 1000 < Date.now();
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
      // If token is expired and there's no refresh token, don't restore the session
      if (isTokenExpired(token) && !refreshToken) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setIsLoading(false);
        return;
      }

      try {
        const parsed: User = JSON.parse(userData);
        if (!parsed.id) {
          parsed.id = extractUserId(token);
          localStorage.setItem('userData', JSON.stringify(parsed));
        }
        setUser(parsed);
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      const userData: User = {
        id: extractUserId(response.token),
        firstName: response.fullName.split(' ')[0],
        lastName: response.fullName.split(' ')[1] || '',
        email: response.email,
        role: response.role,
      };

      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      const userData: User = {
        id: extractUserId(response.token),
        firstName: data.firstName,
        lastName: data.lastName,
        email: response.email,
        role: response.role,
      };
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // Ignore — still clear local state
      }
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
