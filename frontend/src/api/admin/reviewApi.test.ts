import { adminReviewApi } from './reviewApi';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('adminReviewApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllReviews', () => {
    it('認証トークン付きでGETリクエストを送信する', async () => {
      const reviews = [{ id: 1, rating: 5, comment: 'Great' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(reviews),
      });

      const result = await adminReviewApi.getAllReviews();

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/reviews');
      // 認証は httpOnly Cookie で行うため、ブラウザ側からトークンを送らない
      expect(options?.headers?.Authorization).toBeUndefined();
      expect(result).toEqual(reviews);
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(adminReviewApi.getAllReviews()).rejects.toThrow('Failed to fetch reviews');
    });
  });

  describe('deleteReview', () => {
    it('DELETEリクエストを送信する', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await adminReviewApi.deleteReview(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/reviews/1');
      expect(options.method).toBe('DELETE');
      // 認証は httpOnly Cookie で行うため、ブラウザ側からトークンを送らない
      expect(options?.headers?.Authorization).toBeUndefined();
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 });

      await expect(adminReviewApi.deleteReview(1)).rejects.toThrow('Failed to delete review');
    });
  });
});
