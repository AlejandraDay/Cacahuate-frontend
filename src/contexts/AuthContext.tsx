import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authService } from '../services/auth';
import type { AuthContextType, User, RegisterRequest } from '../types';

const decodeJwtId = (token: string): string => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return (
      payload.sub ||
      payload.nameid ||
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      ''
    )
  } catch {
    return ''
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      try {
        const parsed: User = JSON.parse(userData)
        if (!parsed.id) {
          parsed.id = decodeJwtId(token)
          localStorage.setItem('userData', JSON.stringify(parsed))
        }
        setUser(parsed)
      } catch {
        localStorage.removeItem('authToken');
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
        id: decodeJwtId(response.token),
        firstName: response.fullName.split(' ')[0],
        lastName: response.fullName.split(' ')[1] || '',
        email: response.email,
        role: response.role,
      };

      localStorage.setItem('authToken', response.token);
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
        id: decodeJwtId(response.token),
        firstName: data.firstName,
        lastName: data.lastName,
        email: response.email,
        role: response.role,
      };
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    Cookies.remove('authToken');
    Cookies.remove('userData');
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
