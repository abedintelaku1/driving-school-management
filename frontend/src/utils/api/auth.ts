import { getApiUrl, getAuthHeaders, handleResponse, setToken, clearToken, ApiResponse } from './config';

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await handleResponse<{ user: any; token: string }>(res);

      if (result.ok && result.data?.token) {
        setToken(result.data.token);
      }
      return result;
    } catch (err) {
      console.error('Login error:', err);
      return { ok: false, status: 500, data: { message: 'Network error or server unavailable' } as any };
    }
  },

  async me(): Promise<ApiResponse<{ user: any }>> {
    try {
      const res = await fetch(getApiUrl('/api/auth/me'), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  clearToken
};

