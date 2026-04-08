'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { admin, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!admin || !isAdmin)) {
      router.replace('/admin/login');
    }
  }, [admin, isAdmin, isLoading, router]);

  // 認証チェック中はローディングスピナーを表示
  if (isLoading || !admin || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return <>{children}</>;
}
