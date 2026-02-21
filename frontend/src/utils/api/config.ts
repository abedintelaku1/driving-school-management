const API_URL = import.meta.env.VITE_API_URL || '';

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  status?: number;
};

const tokenKey = 'auth_token';

export const getAuthHeaders = () => {
  const token = localStorage.getItem(tokenKey);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    return { ok: false, data, status: res.status };
  }
  return { ok: true, data, status: res.status };
}

export function getApiUrl(path: string): string {
  // If API_URL is not configured, use relative path (will be proxied by Vite)
  // This allows the app to work even when backend is not running
  if (!API_URL || API_URL.trim() === '') {
    return path;
  }
  return `${API_URL}${path}`;
}

export function setToken(token: string): void {
  localStorage.setItem(tokenKey, token);
}

export function clearToken(): void {
  localStorage.removeItem(tokenKey);
}

