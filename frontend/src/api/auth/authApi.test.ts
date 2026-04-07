import { authApi } from './authApi';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('ユーザー情報を返す', async () => {
      const userData = { customer: { id: 1, name: 'Test' }, isAdmin: false };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(userData),
      });

      const result = await authApi.getCurrentUser('test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/auth/me');
      expect(options.headers.Authorization).toBe('Bearer test-token');
      expect(result).toEqual(userData);
    });

    it('レスポンスが非OKの場合はnullを返す', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401 });

      const result = await authApi.getCurrentUser('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('POSTリクエストを送信する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'logged out' }),
      });

      await authApi.logout('test-token');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/auth/logout');
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe('Bearer test-token');
    });

    it('レスポンスがエラーの場合は例外を投げる', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(authApi.logout('token')).rejects.toThrow('Failed to logout');
    });
  });

  describe('getGoogleLoginUrl', () => {
    it('Google OAuth URLを返す', () => {
      const url = authApi.getGoogleLoginUrl();
      expect(url).toContain('/api/auth/google');
    });
  });

  describe('getAdminGoogleLoginUrl', () => {
    it('管理者用Google OAuth URLを返す', () => {
      const url = authApi.getAdminGoogleLoginUrl();
      expect(url).toContain('/api/auth/admin/google');
    });
  });
});
