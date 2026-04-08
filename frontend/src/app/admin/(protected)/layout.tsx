import { ReactNode } from 'react';
import { ProtectedAdminRoute } from '@/components/auth/ProtectedAdminRoute';

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return <ProtectedAdminRoute>{children}</ProtectedAdminRoute>;
}
