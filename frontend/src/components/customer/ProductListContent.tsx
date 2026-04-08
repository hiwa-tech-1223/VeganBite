'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Leaf, User, Loader2 } from 'lucide-react';
import { productApi } from '@/api/customer/productApi';
import { ApiProduct, ApiCategory } from '@/api/customer/productTypes';
import { StarRating } from '@/components/common/StarRating';
import { Footer } from '@/components/common/Footer';
import { useAuth } from '@/contexts/AuthContext';

interface ProductListContentProps {
  initialProducts: ApiProduct[];
  initialCategories: ApiCategory[];
}

export function ProductListContent({
  initialProducts,
  initialCategories,
}: ProductListContentProps) {
  const { customer } = useAuth();
  const [products, setProducts] = useState<ApiProduct[]>(initialProducts);
  const [categories] = useState<ApiCategory[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<'all' | number>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 6;

  // フィルター変更時: 商品を再取得
  useEffect(() => {
    // 初期状態（全カテゴリ・検索クエリなし）ではSSRデータをそのまま使う
    if (selectedCategory === 'all' && searchQuery === '') {
      setProducts(initialProducts);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productApi.getProducts({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchQuery,
        });
        setProducts(data ?? []);
      } catch (err) {
        setError('商品の取得に失敗しました / Failed to fetch products');
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // デバウンス: 検索入力時は300ms、カテゴリ変更は即時
    const debounceTimer = setTimeout(fetchProducts, searchQuery ? 300 : 0);
    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, searchQuery, initialProducts]);

  // ページネーション計算
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Leaf className="w-8 h-8" style={{ color: 'var(--primary)' }} />
                <span className="text-2xl" style={{ color: 'var(--primary)' }}>VeganBite</span>
              </Link>

              <nav className="flex items-center gap-3 sm:gap-6">
                <Link href="/" className="hover:opacity-70 text-sm sm:text-base" style={{ color: 'var(--text)' }}>
                  <span className="hidden sm:inline">Home / ホーム</span>
                  <span className="sm:hidden">Home</span>
                </Link>
                {customer ? (
                  <Link
                    href="/mypage"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base whitespace-nowrap"
                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">My Page</span>
                    <span className="sm:hidden">My</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base whitespace-nowrap"
                    style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                  >
                    <span className="hidden sm:inline">Login / ログイン</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                )}
              </nav>
            </div>

            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products... / 製品を検索..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-[var(--primary)]"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto py-4">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className="whitespace-nowrap px-4 py-2 rounded-full transition-all"
              style={{
                backgroundColor: selectedCategory === 'all' ? 'var(--primary)' : 'transparent',
                color: selectedCategory === 'all' ? 'white' : 'var(--text)',
              }}
            >
              All / すべて
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setCurrentPage(1);
                }}
                className="whitespace-nowrap px-4 py-2 rounded-full transition-all"
                style={{
                  backgroundColor: selectedCategory === category.id ? 'var(--primary)' : 'transparent',
                  color: selectedCategory === category.id ? 'white' : 'var(--text)',
                }}
              >
                {category.name} / {category.nameJa}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-full"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            >
              Retry / 再試行
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ color: 'var(--text)' }}>
              No products found / 商品が見つかりません
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative w-full h-48">
                    <Image
                      src={product.imageUrl || 'https://placehold.co/400x300?text=No+Image'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.categories && product.categories.length > 0 ? (
                        product.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="inline-block px-3 py-1 rounded-full text-sm"
                            style={{ backgroundColor: 'var(--background)', color: 'var(--primary)' }}
                          >
                            {cat.name} / {cat.nameJa}
                          </span>
                        ))
                      ) : (
                        <span
                          className="inline-block px-3 py-1 rounded-full text-sm"
                          style={{ backgroundColor: 'var(--background)', color: 'var(--primary)' }}
                        >
                          Uncategorized / 未分類
                        </span>
                      )}
                    </div>
                    <h3 className="mb-1" style={{ color: 'var(--text)' }}>
                      {product.name}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
                      {product.nameJa}
                    </p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={product.rating} showValue size="sm" />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>
                        ({product.reviewCount})
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className="w-10 h-10 rounded-full"
                    style={{
                      backgroundColor: currentPage === i + 1 ? 'var(--primary)' : 'white',
                      color: currentPage === i + 1 ? 'white' : 'var(--text)',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer showAffiliateNotice />
    </div>
  );
}
