'use client';

import { use } from 'react';
import { AdminProductForm } from '@/components/admin/AdminProductForm';

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AdminProductForm productId={Number(id)} />;
}
