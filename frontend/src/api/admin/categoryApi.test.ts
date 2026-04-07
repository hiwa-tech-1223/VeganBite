import { categoryApi } from './categoryApi';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('categoryApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('POSTリクエストでカテゴリを作成する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Snacks' }),
      });

      const result = await categoryApi.createCategory({ name: 'Snacks', nameJa: 'スナック' }, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/categories');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers.Authorization).toBe('Bearer test-token');
      expect(JSON.parse(options.body)).toEqual({ name: 'Snacks', nameJa: 'スナック' });
      expect(result).toEqual({ id: 1, name: 'Snacks' });
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(
        categoryApi.createCategory({ name: 'Test', nameJa: 'テスト' }, 'token')
      ).rejects.toThrow('Failed to create category');
    });
  });

  describe('updateCategory', () => {
    it('PUTリクエストでカテゴリを更新する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Updated' }),
      });

      await categoryApi.updateCategory(1, { name: 'Updated', nameJa: '更新済み' }, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/categories/1');
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual({ name: 'Updated', nameJa: '更新済み' });
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      await expect(
        categoryApi.updateCategory(999, { name: 'Test', nameJa: 'テスト' }, 'token')
      ).rejects.toThrow('Failed to update category');
    });
  });

  describe('deleteCategory', () => {
    it('DELETEリクエストを送信する', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await categoryApi.deleteCategory(1, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/categories/1');
      expect(options.method).toBe('DELETE');
      expect(options.headers.Authorization).toBe('Bearer test-token');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 });

      await expect(categoryApi.deleteCategory(1, 'token')).rejects.toThrow('Failed to delete category');
    });
  });
});
