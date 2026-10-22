import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  demoLogin: (role?: 'admin' | 'agent') => Promise<void>;
  logout: () => void;
  switchRole: (role: 'admin' | 'agent') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'usr_admin_1',
    name: 'Sarah Connor',
    email: 'admin@whatbot.io',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('whatbot_token') || 'demo_token_admin');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Attempt verifying saved token with backend if exists
    const storedToken = localStorage.getItem('whatbot_token');
    if (storedToken) {
      api.auth.getMe()
        .then((res) => {
          if (res.user) setUser(res.user);
        })
        .catch(() => {
          // If offline or token expired, keep demo user state active
        });
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(credentials);
      if (res.token && res.user) {
        localStorage.setItem('whatbot_token', res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(userData);
      if (res.token && res.user) {
        localStorage.setItem('whatbot_token', res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'admin' | 'agent' = 'admin') => {
    setIsLoading(true);
    try {
      const res = await api.auth.demoLogin(role);
      if (res.token && res.user) {
        localStorage.setItem('whatbot_token', res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } catch (e) {
      // Local fallback
      setUser({
        id: role === 'admin' ? 'usr_admin_1' : 'usr_agent_2',
        name: role === 'admin' ? 'Sarah Connor' : 'Alex Rivera',
        email: role === 'admin' ? 'admin@whatbot.io' : 'alex@whatbot.io',
        role,
        avatar: role === 'admin'
          ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: 'admin' | 'agent') => {
    await demoLogin(role);
  };

  const logout = () => {
    localStorage.removeItem('whatbot_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
