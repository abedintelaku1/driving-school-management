import { getApiUrl, getAuthHeaders, handleResponse, ApiResponse } from './config';

export const packagesApi = {
  async list(): Promise<ApiResponse<any[]>> {
    try {
      const res = await fetch(getApiUrl('/api/packages'), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async get(id: string): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl(`/api/packages/${id}`), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async create(payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl('/api/packages'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async update(id: string, payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl(`/api/packages/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async delete(id: string): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl(`/api/packages/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async getLicenseCategories(): Promise<ApiResponse<string[]>> {
    try {
      const res = await fetch(getApiUrl('/api/packages/license-categories'), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  }
};

