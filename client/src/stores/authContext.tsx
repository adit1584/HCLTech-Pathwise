import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  experienceLevel?: string;
  hasGoals?: boolean;
  hasCompletedDiagnostic?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  sendOtp: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string; email: string; devOtp?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pathwise_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch {
      localStorage.removeItem('pathwise_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('pathwise_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    localStorage.setItem('pathwise_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const sendOtp = async (name: string, email: string, password: string) => {
    return await api.sendOtp({ name, email, password });
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.verifyOtp({ email, otp });
    localStorage.setItem('pathwise_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register({ name, email, password });
    localStorage.setItem('pathwise_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('pathwise_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        demoLogin,
        register,
        sendOtp,
        verifyOtp,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
