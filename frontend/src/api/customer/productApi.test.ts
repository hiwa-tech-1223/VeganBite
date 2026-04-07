import { productApi } from './productApi';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('productApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('カテゴリ一覧を取得する', async () => {
      const categories = [{ id: 1, name: 'Snacks' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(categories),
      });

      const result = await productApi.getCategories();

      expect(mockFetch.mock.calls[0][0]).toContain('/api/categories');
      expect(result).toEqual(categories);
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(productApi.getCategories()).rejects.toThrow('Failed to fetch categories');
    });
  });

  describe('getProducts', () => {
    it('パラメータなしで全商品を取得する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await productApi.getProducts();

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/api/products');
      expect(url).not.toContain('?');
    });

    it('categoryパラメータをクエリ文字列に含める', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await productApi.getProducts({ category: 3 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('category=3');
    });

    it('searchパラメータをクエリ文字列に含める', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await productApi.getProducts({ search: 'tofu' });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('search=tofu');
    });

    it('categoryとsearchの両方をクエリ文字列に含める', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await productApi.getProducts({ category: 2, search: 'milk' });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('category=2');
      expect(url).toContain('search=milk');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(productApi.getProducts()).rejects.toThrow('Failed to fetch products');
    });
  });

  describe('getProduct', () => {
    it('商品詳細を取得する', async () => {
      const product = { id: 1, name: 'Tofu' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(product),
      });

      const result = await productApi.getProduct(1);

      expect(mockFetch.mock.calls[0][0]).toContain('/api/products/1');
      expect(result).toEqual(product);
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      await expect(productApi.getProduct(999)).rejects.toThrow('Failed to fetch product');
    });
  });
});
