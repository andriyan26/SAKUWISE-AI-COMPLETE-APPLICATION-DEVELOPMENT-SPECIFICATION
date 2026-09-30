import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api-client.js';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: string;
  themePreference: string;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (_) {
      setUser(null);
      localStorage.removeItem('sakuwise_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res && res.success && res.data) {
      if (res.data.token) {
        localStorage.setItem('sakuwise_token', res.data.token);
      }
      setUser(res.data.user);
    } else {
      throw new Error(res?.message || 'Email atau kata sandi tidak cocok. Silakan coba lagi.');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res && res.success && res.data) {
      if (res.data.token) {
        localStorage.setItem('sakuwise_token', res.data.token);
      }
      setUser(res.data.user);
    } else {
      throw new Error(res?.message || 'Pendaftaran gagal. Periksa kembali form data Anda.');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    localStorage.removeItem('sakuwise_token');
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
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
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
