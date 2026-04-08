import { customerApi } from './customerApi';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('customerApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('お気に入り一覧を取得する', async () => {
      const favorites = [{ id: 1, productId: 10 }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(favorites),
      });

      const result = await customerApi.getFavorites(1, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/customers/1/favorites');
      expect(options.headers.Authorization).toBe('Bearer test-token');
      expect(result).toEqual(favorites);
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(customerApi.getFavorites(1, 'token')).rejects.toThrow('Failed to fetch favorites');
    });
  });

  describe('addFavorite', () => {
    it('productIdを含めてPOSTリクエストを送信する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, productId: 10 }),
      });

      await customerApi.addFavorite(1, 10, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/customers/1/favorites');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ productId: 10 });
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400 });

      await expect(customerApi.addFavorite(1, 10, 'token')).rejects.toThrow('Failed to add favorite');
    });
  });

  describe('removeFavorite', () => {
    it('DELETEリクエストを送信する', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await customerApi.removeFavorite(1, 10, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/customers/1/favorites/10');
      expect(options.method).toBe('DELETE');
      expect(options.headers.Authorization).toBe('Bearer test-token');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      await expect(customerApi.removeFavorite(1, 10, 'token')).rejects.toThrow('Failed to remove favorite');
    });
  });

  describe('getReviews', () => {
    it('カスタマーのレビュー一覧を取得する', async () => {
      const reviews = [{ id: 1, rating: 5 }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(reviews),
      });

      const result = await customerApi.getReviews(1, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/customers/1/reviews');
      expect(options.headers.Authorization).toBe('Bearer test-token');
      expect(result).toEqual(reviews);
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(customerApi.getReviews(1, 'token')).rejects.toThrow('Failed to fetch reviews');
    });
  });
});
