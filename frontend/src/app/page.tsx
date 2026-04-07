import { productApi } from '@/api/customer/productApi';
import { ProductListContent } from '@/components/customer/ProductListContent';
import type { ApiProduct, ApiCategory } from '@/api/customer/productTypes';

// ISR: 60秒ごとに再検証
export const revalidate = 60;

export default async function HomePage() {
  let products: ApiProduct[] = [];
  let categories: ApiCategory[] = [];

  try {
    [categories, products] = await Promise.all([
      productApi.getCategories(),
      productApi.getProducts(),
    ]);
  } catch (err) {
    console.error('Failed to fetch initial data for home page:', err);
  }

  return (
    <ProductListContent
      initialProducts={products ?? []}
      initialCategories={categories ?? []}
    />
  );
}
