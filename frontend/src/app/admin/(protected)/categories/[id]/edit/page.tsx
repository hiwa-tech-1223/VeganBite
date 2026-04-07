'use client';

import { use } from 'react';
import { AdminCategoryForm } from '@/components/admin/AdminCategoryForm';

export default function AdminCategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AdminCategoryForm categoryId={Number(id)} />;
}
