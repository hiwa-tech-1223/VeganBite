import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productApi } from '@/api/customer/productApi';
import { reviewApi } from '@/api/customer/reviewApi';
import { ProductDetailContent } from '@/components/customer/ProductDetailContent';
import type { ApiReview } from '@/api/customer/reviewTypes';

// ISR: 60秒ごとに再検証
export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId) || productId <= 0) {
    return { title: 'Product Not Found' };
  }

  try {
    const product = await productApi.getProduct(productId);
    const title = `${product.name} / ${product.nameJa}`;
    const description =
      product.descriptionJa?.slice(0, 160) ||
      product.description?.slice(0, 160) ||
      'VeganBiteのヴィーガン商品情報';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: product.imageUrl ? [product.imageUrl] : [],
      },
    };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId) || productId <= 0) {
    notFound();
  }

  let product;
  try {
    product = await productApi.getProduct(productId);
  } catch (err) {
    console.error('Failed to fetch product:', err);
    notFound();
  }

  let reviews: ApiReview[] = [];
  try {
    reviews = (await reviewApi.getProductReviews(productId)) ?? [];
  } catch (err) {
    console.error('Failed to fetch reviews:', err);
  }

  return <ProductDetailContent initialProduct={product} initialReviews={reviews} />;
}
