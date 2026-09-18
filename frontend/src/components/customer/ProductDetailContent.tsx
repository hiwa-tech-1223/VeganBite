'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Leaf, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { productApi } from '@/api/customer/productApi';
import { ApiProduct } from '@/api/customer/productTypes';
import { reviewApi } from '@/api/customer/reviewApi';
import { ApiReview } from '@/api/customer/reviewTypes';
import { customerApi } from '@/api/customer/customerApi';
import { StarRating } from '@/components/common/StarRating';
import { Footer } from '@/components/common/Footer';
import { ReviewForm, ReviewFormValues } from '@/components/customer/ReviewForm';

interface ProductDetailContentProps {
  initialProduct: ApiProduct;
  initialReviews: ApiReview[];
}

export function ProductDetailContent({
  initialProduct,
  initialReviews,
}: ProductDetailContentProps) {
  const router = useRouter();
  const { customer } = useAuth();

  const [product, setProduct] = useState<ApiProduct>(initialProduct);
  const [reviews, setReviews] = useState<ApiReview[]>(initialReviews);

  // お気に入り状態
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // レビューフォーム

  const productId = product.id;
  const customerId = customer?.id;

  // ログイン中のカスタマーの既存レビュー（あれば編集モード）。レビュー一覧から導出する
  const existingCustomerReview = useMemo(
    () => (customerId ? reviews.find((r) => r.customerId === customerId) ?? null : null),
    [customerId, reviews],
  );
  const isEditMode = existingCustomerReview !== null;

  // お気に入り状態を取得
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!customer) return;
      try {
        const favorites = await customerApi.getFavorites(customer.id);
        const isFav = favorites?.some((f: { productId: number }) => f.productId === productId) ?? false;
        setIsFavorite(isFav);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      }
    };
    fetchFavorites();
  }, [customer, productId]);

  // レビューの投稿・更新。失敗したら例外をそのまま投げ、フォーム側でメッセージを表示する
  const handleSubmitReview = async ({ rating, comment }: ReviewFormValues): Promise<void> => {
    if (existingCustomerReview) {
      const updatedReview = await reviewApi.updateReview(existingCustomerReview.id, { rating, comment });
      setReviews((prev) => prev.map((r) => (r.id === updatedReview.id ? updatedReview : r)));
    } else {
      const createdReview = await reviewApi.createReview(productId, { rating, comment });
      setReviews((prev) => [createdReview, ...prev]);
    }

    const updatedProduct = await productApi.getProduct(productId);
    setProduct(updatedProduct);
    toast.success(
      existingCustomerReview
        ? 'レビューを更新しました / Review updated successfully!'
        : 'レビューを投稿しました / Review submitted successfully!'
    );
  };

  const toggleFavorite = async () => {
    if (!customer) {
      router.push('/login');
      return;
    }

    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        await customerApi.removeFavorite(customer.id, productId);
        setIsFavorite(false);
      } else {
        await customerApi.addFavorite(customer.id, productId);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
                Back / 戻る
              </button>
              <Link href="/" className="flex items-center gap-2">
                <Leaf className="w-8 h-8" style={{ color: 'var(--primary)' }} />
                <span className="text-2xl" style={{ color: 'var(--primary)' }}>VeganBite</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Product Detail */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8 pb-4 items-start">
            <div className="md:sticky md:top-8">
              <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                <Image
                  src={product.imageUrl || 'https://placehold.co/400x300?text=No+Image'}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover rounded-xl"
                  priority
                />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
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
              <h1 className="text-3xl mb-2" style={{ color: 'var(--text)' }}>
                {product.name}
              </h1>
              <p className="text-xl mb-4" style={{ color: 'var(--text)' }}>
                {product.nameJa}
              </p>
              <div className="flex items-center gap-4 mb-6">
                <StarRating rating={product.rating} showValue size="lg" />
                <span style={{ color: 'var(--text)' }}>
                  ({product.reviewCount} reviews / レビュー)
                </span>
              </div>
              <button
                onClick={toggleFavorite}
                disabled={isTogglingFavorite}
                className="flex items-center gap-2 px-6 py-3 rounded-full mb-4 transition-all disabled:opacity-50"
                style={{
                  backgroundColor: isFavorite ? 'var(--accent)' : 'var(--background)',
                  color: isFavorite ? 'white' : 'var(--primary)',
                }}
              >
                <Heart className="w-5 h-5" fill={isFavorite ? 'white' : 'none'} />
                {isFavorite
                  ? 'Added to Favorites / お気に入り済み'
                  : 'Add to Favorites / お気に入りに追加'}
              </button>
              {(product.amazonUrl || product.rakutenUrl || product.yahooUrl) && (
                <div className="mt-4">
                  <p className="text-sm mb-2" style={{ color: '#666' }}>
                    購入する / Buy Now
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {product.amazonUrl && (
                      <a
                        href={product.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="transition-all hover:opacity-90 hover:shadow-md"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 8px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          backgroundColor: '#FF9900',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                        }}
                      >
                        Amazon
                      </a>
                    )}
                    {product.rakutenUrl && (
                      <a
                        href={product.rakutenUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="transition-all hover:opacity-90 hover:shadow-md"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 8px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          backgroundColor: '#BF0000',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                        }}
                      >
                        楽天市場
                      </a>
                    )}
                    {product.yahooUrl && (
                      <a
                        href={product.yahooUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="transition-all hover:opacity-90 hover:shadow-md"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 8px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          backgroundColor: '#FF0033',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                        }}
                      >
                        Yahoo!
                      </a>
                    )}
                  </div>
                </div>
              )}
              {product.affiliateUrl && !product.amazonUrl && !product.rakutenUrl && !product.yahooUrl && (
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full mb-6 transition-all hover:opacity-90"
                  style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                >
                  <ExternalLink className="w-5 h-5" />
                  Buy Now / 購入する
                </a>
              )}
            </div>
          </div>
          <div className="px-8 pb-8">
            <h2 className="text-xl mb-3" style={{ color: 'var(--text)' }}>
              Description / 説明
            </h2>
            <p className="mb-2" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {product.description}
            </p>
            <p style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {product.descriptionJa}
            </p>
          </div>
        </div>

        {/* Review Form: 既存レビューが見つかったら key が変わり、その内容を初期値として作り直される */}
        <ReviewForm
          key={existingCustomerReview?.id ?? 'new'}
          initialValues={{
            rating: existingCustomerReview?.rating ?? 5,
            comment: existingCustomerReview?.comment ?? '',
          }}
          isEditMode={isEditMode}
          isLoggedIn={customer !== null}
          onLoginRequired={() => router.push('/login')}
          onSubmit={handleSubmitReview}
        />

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-md p-8 mt-8">
          <h2 className="text-2xl mb-6" style={{ color: 'var(--text)' }}>
            Reviews / レビュー ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--text)' }}>
              No reviews yet / まだレビューがありません
            </p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={review.customer?.avatar || 'https://placehold.co/48x48?text=Customer'}
                      alt={review.customer?.name || 'Customer'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p style={{ color: 'var(--text)' }}>{review.customer?.name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p style={{ color: 'var(--text)' }}>{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer showAffiliateNotice />
    </div>
  );
}
