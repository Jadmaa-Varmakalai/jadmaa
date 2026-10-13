import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../lib/api/authApi';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (name: string, email: string, phone: string, password?: string, extraOptions?: any) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialUser = (): User | null => {
  try {
    const token = localStorage.getItem('jadmaa_token');
    const raw = localStorage.getItem('jadmaa_user');
    if (token && raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [loading, setLoading] = useState<boolean>(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jadmaa_token') : null;
    const initial = getInitialUser();
    // Only show blocking loading if token exists but user object is not yet cached
    return Boolean(token && !initial);
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('jadmaa_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.data) {
            setUser(res.data);
            try {
              localStorage.setItem('jadmaa_user', JSON.stringify(res.data));
            } catch (_) {}
          }
        } catch (err: any) {
          console.warn('Auth session expired or invalid', err.message);
          localStorage.removeItem('jadmaa_token');
          localStorage.removeItem('jadmaa_refresh_token');
          localStorage.removeItem('jadmaa_user');
          setUser(null);
        }
      } else {
        localStorage.removeItem('jadmaa_user');
        localStorage.removeItem('jadmaa_refresh_token');
        setUser(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const res = await authApi.login({ email, password: password || 'defaultpass123' });
      if (res.success && res.data) {
        localStorage.setItem('jadmaa_token', res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem('jadmaa_refresh_token', res.data.refreshToken);
        }
        const loggedInUser = res.data.user;
        try {
          localStorage.setItem('jadmaa_user', JSON.stringify(loggedInUser));
        } catch (_) {}
        if (res.data.showInstructorApprovalNotice) {
          sessionStorage.setItem('jadmaa_instructor_approved_notice', 'true');
        }
        setUser(loggedInUser);
        return loggedInUser;
      } else {
        throw new Error(res.error?.message || 'Login failed');
      }
    } catch (err: any) {
      
      throw err;
    }
  };

  const register = async (name: string, email: string, phone: string, password?: string, extraOptions?: any) => {
    try {
      const res = await authApi.register({ 
        name, 
        email, 
        phone, 
        password: password || 'defaultpass123',
        ...extraOptions 
      });
      if (!res.success) { 
        throw new Error(res.error?.message || 'Registration failed');
      }
      return await login(email, password);
    } catch (err: any) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      localStorage.removeItem('jadmaa_token');
      localStorage.removeItem('jadmaa_refresh_token');
      localStorage.removeItem('jadmaa_user');
      try {
        sessionStorage.removeItem('jadmaa_enrollments_cache');
        sessionStorage.removeItem('jadmaa_dashboard_cache');
      } catch (_) {}
      // Force a hard reload to clear all module memory caches
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, register, logout, loading }}>
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
