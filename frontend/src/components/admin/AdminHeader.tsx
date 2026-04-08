'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield } from 'lucide-react';
import { Admin } from '@/api/auth/authTypes';

interface AdminHeaderProps {
  admin: Admin;
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const pathname = usePathname() ?? '';
  const isProductsActive = pathname.includes('/admin/products');
  const isCategoriesActive = pathname.includes('/admin/categories');
  const isReviewsActive = pathname.includes('/admin/reviews');
  const isCustomersActive = pathname.includes('/admin/customers');

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/admin/products" className="flex items-center gap-2">
            <Shield className="w-7 h-7" style={{ color: '#4A7C59' }} />
            <span className="text-xl" style={{ color: '#4A7C59' }}>
              VeganBite Admin
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{admin.name}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={admin.avatar}
              alt={admin.name}
              className="w-9 h-9 rounded-full object-cover"
            />
          </div>
        </div>

        <nav className="flex gap-6">
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: isProductsActive ? '#4A7C59' : 'transparent',
              color: isProductsActive ? 'white' : '#333333'
            }}
          >
            Products
          </Link>
          <Link
            href="/admin/categories"
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: isCategoriesActive ? '#4A7C59' : 'transparent',
              color: isCategoriesActive ? 'white' : '#333333'
            }}
          >
            Categories
          </Link>
          <Link
            href="/admin/reviews"
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: isReviewsActive ? '#4A7C59' : 'transparent',
              color: isReviewsActive ? 'white' : '#333333'
            }}
          >
            Reviews
          </Link>
          <Link
            href="/admin/customers"
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: isCustomersActive ? '#4A7C59' : 'transparent',
              color: isCustomersActive ? 'white' : '#333333'
            }}
          >
            Customers
          </Link>
        </nav>
      </div>
    </header>
  );
}
