'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedCustomerRoute({ children }: { children: ReactNode }) {
  const { customer, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !customer) {
      router.replace('/login');
    }
  }, [customer, isLoading, router]);

  // 認証チェック中はローディングスピナーを表示
  if (isLoading || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return <>{children}</>;
}
