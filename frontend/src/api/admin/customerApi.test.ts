import { adminApi } from './customerApi';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('adminApi (customer)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomers', () => {
    it('ステータスコードを文字列に変換する（0→active, 1→banned, 2→suspended）', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, name: 'User A', status: 0 },
            { id: 2, name: 'User B', status: 1 },
            { id: 3, name: 'User C', status: 2 },
          ]),
      });

      const result = await adminApi.getCustomers('test-token');

      expect(result).toEqual([
        expect.objectContaining({ id: 1, name: 'User A', status: 'active' }),
        expect.objectContaining({ id: 2, name: 'User B', status: 'banned' }),
        expect.objectContaining({ id: 3, name: 'User C', status: 'suspended' }),
      ]);
    });

    it('不明なステータスコードはactiveにフォールバックする', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: 'User', status: 99 }]),
      });

      const result = await adminApi.getCustomers('test-token');

      expect(result[0].status).toBe('active');
    });

    it('認証トークンをヘッダーに含める', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await adminApi.getCustomers('my-token');

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers.Authorization).toBe('Bearer my-token');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(adminApi.getCustomers('token')).rejects.toThrow('Failed to fetch customers');
    });
  });

  describe('banCustomer', () => {
    it('理由を含めてPOSTリクエストを送信する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, status: 1 }),
      });

      const result = await adminApi.banCustomer(1, 'spam', 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/admin/customers/1/ban');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ reason: 'spam' });
      expect(result.status).toBe('banned');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 });

      await expect(adminApi.banCustomer(1, 'spam', 'token')).rejects.toThrow('Failed to ban customer');
    });
  });

  describe('suspendCustomer', () => {
    it('期間と理由を含めてPOSTリクエストを送信する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, status: 2 }),
      });

      const result = await adminApi.suspendCustomer(1, 7, 'violation', 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/admin/customers/1/suspend');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ duration: 7, reason: 'violation' });
      expect(result.status).toBe('suspended');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(adminApi.suspendCustomer(1, 7, 'reason', 'token')).rejects.toThrow('Failed to suspend customer');
    });
  });

  describe('unbanCustomer', () => {
    it('POSTリクエストを送信しステータスを変換する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, status: 0 }),
      });

      const result = await adminApi.unbanCustomer(1, 'test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/admin/customers/1/unban');
      expect(options.method).toBe('POST');
      expect(result.status).toBe('active');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(adminApi.unbanCustomer(1, 'token')).rejects.toThrow('Failed to unban customer');
    });
  });
});
