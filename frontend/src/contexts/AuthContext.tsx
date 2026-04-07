'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Customer, Admin, AuthContextType } from '@/api/auth/authTypes';
import { authApi } from '@/api/auth/authApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // トークンからユーザー情報を取得
  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const data = await authApi.getCurrentUser(authToken);
      if (!data) {
        localStorage.removeItem('token');
        setToken(null);
        setCustomer(null);
        setAdmin(null);
        setIsAdmin(false);
        return;
      }
      if (data.isAdmin) {
        setAdmin(data.admin);
        setCustomer(null);
        setIsAdmin(true);
      } else {
        setCustomer(data.customer);
        setAdmin(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setCustomer(null);
      setAdmin(null);
      setIsAdmin(false);
    }
  }, []);

  // 初期化時にlocalStorageからトークンを読み、ユーザー情報を取得（クライアントのみ）
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchCurrentUser(storedToken);
      }
      setIsLoading(false);
    };
    initAuth();
  }, [fetchCurrentUser]);

  // ログイン処理
  const login = useCallback(
    async (newToken: string) => {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      await fetchCurrentUser(newToken);
    },
    [fetchCurrentUser]
  );

  // ログアウト処理
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setCustomer(null);
    setAdmin(null);
    setIsAdmin(false);
  }, []);

  // 認証ヘッダーを取得
  const getAuthHeader = useCallback(() => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        customer,
        admin,
        token,
        isLoading,
        isAdmin,
        login,
        logout,
        getAuthHeader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
