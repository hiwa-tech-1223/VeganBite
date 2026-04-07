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

      const result = await adminReviewApi.getAllReviews('test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/reviews');
      expect(options.headers.Authorization).toBe('Bearer test-token');
      expect(result).toEqual(reviews);
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(adminReviewApi.getAllReviews('token')).rejects.toThrow('Failed to fetch reviews');
    });
  });

  describe('deleteReview', () => {
    it('DELETEリクエストを送信する', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await adminReviewApi.deleteReview(1, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/reviews/1');
      expect(options.method).toBe('DELETE');
      expect(options.headers.Authorization).toBe('Bearer test-token');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 });

      await expect(adminReviewApi.deleteReview(1, 'token')).rejects.toThrow('Failed to delete review');
    });
  });
});
