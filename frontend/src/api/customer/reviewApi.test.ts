import { reviewApi } from './reviewApi';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('reviewApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductReviews', () => {
    it('商品のレビュー一覧を取得する', async () => {
      const reviews = [{ id: 1, rating: 5, comment: 'Great' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(reviews),
      });

      const result = await reviewApi.getProductReviews(10);

      expect(mockFetch.mock.calls[0][0]).toContain('/api/products/10/reviews');
      expect(result).toEqual(reviews);
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(reviewApi.getProductReviews(10)).rejects.toThrow('Failed to fetch reviews');
    });
  });

  describe('createReview', () => {
    it('レビューを投稿する', async () => {
      const review = { id: 1, rating: 4, comment: 'Good' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(review),
      });

      const result = await reviewApi.createReview(10, { rating: 4, comment: 'Good' }, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/products/10/reviews');
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe('Bearer test-token');
      expect(JSON.parse(options.body)).toEqual({ rating: 4, comment: 'Good' });
      expect(result).toEqual(review);
    });

    it('エラーレスポンスからサーバーのエラーメッセージを取得する', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Already reviewed this product' }),
      });

      await expect(
        reviewApi.createReview(10, { rating: 3, comment: 'OK' }, 'token')
      ).rejects.toThrow('Already reviewed this product');
    });

    it('サーバーのエラーメッセージがない場合はデフォルトメッセージを使用する', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(
        reviewApi.createReview(10, { rating: 3, comment: 'OK' }, 'token')
      ).rejects.toThrow('Failed to create review');
    });
  });

  describe('updateReview', () => {
    it('レビューを更新する', async () => {
      const updated = { id: 1, rating: 5, comment: 'Updated' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updated),
      });

      const result = await reviewApi.updateReview(1, { rating: 5, comment: 'Updated' }, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/reviews/1');
      expect(options.method).toBe('PUT');
      expect(result).toEqual(updated);
    });

    it('エラーレスポンスからサーバーのエラーメッセージを取得する', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid rating' }),
      });

      await expect(
        reviewApi.updateReview(1, { rating: 0, comment: 'Bad' }, 'token')
      ).rejects.toThrow('Invalid rating');
    });

    it('サーバーのエラーメッセージがない場合はデフォルトメッセージを使用する', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(
        reviewApi.updateReview(1, { rating: 3, comment: 'OK' }, 'token')
      ).rejects.toThrow('Failed to update review');
    });
  });

  describe('deleteReview', () => {
    it('DELETEリクエストを送信する', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await reviewApi.deleteReview(1, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/reviews/1');
      expect(options.method).toBe('DELETE');
      expect(options.headers.Authorization).toBe('Bearer test-token');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 });

      await expect(reviewApi.deleteReview(1, 'token')).rejects.toThrow('Failed to delete review');
    });
  });
});
