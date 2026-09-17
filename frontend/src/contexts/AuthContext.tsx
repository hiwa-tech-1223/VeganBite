'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Customer, Admin, AuthContextType } from '@/api/auth/authTypes';
import { authApi } from '@/api/auth/authApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 以前 localStorage に JWT を保存していたときのキー。httpOnly Cookie に移行したため、残っていれば削除する
const LEGACY_TOKEN_STORAGE_KEY = 'token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const clearUser = useCallback((): void => {
    setCustomer(null);
    setAdmin(null);
    setIsAdmin(false);
  }, []);

  // セッション Cookie（ブラウザが自動送信）でユーザー情報を取得する
  const fetchCurrentUser = useCallback(async (): Promise<void> => {
    try {
      const data = await authApi.getCurrentUser();
      if (!data) {
        clearUser();
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
      clearUser();
    }
  }, [clearUser]);

  // 初期化時にログイン状態を取得する（クライアントのみ）
  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
      } catch {
        // ストレージが使えない環境では何もしない
      }
      await fetchCurrentUser();
      setIsLoading(false);
    };
    initAuth();
  }, [fetchCurrentUser]);

  // ログアウト処理（サーバーでセッション Cookie を削除してから画面の状態を消す）
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      clearUser();
    }
  }, [clearUser]);

  return (
    <AuthContext.Provider
      value={{
        customer,
        admin,
        isLoading,
        isAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
