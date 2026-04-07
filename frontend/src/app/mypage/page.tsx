'use client';

import { ProtectedCustomerRoute } from '@/components/auth/ProtectedCustomerRoute';
import { MyPageContent } from '@/components/customer/MyPageContent';

export default function MyPage() {
  return (
    <ProtectedCustomerRoute>
      <MyPageContent />
    </ProtectedCustomerRoute>
  );
}
