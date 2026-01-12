const API_URL = import.meta.env.VITE_API_URL || 'http://128.140.121.69';

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
  return `${API_URL}${path}`;
}

export function setToken(token: string): void {
  localStorage.setItem(tokenKey, token);
}

export function clearToken(): void {
  localStorage.removeItem(tokenKey);
}

