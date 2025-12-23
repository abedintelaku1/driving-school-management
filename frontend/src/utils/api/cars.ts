import { getApiUrl, getAuthHeaders, handleResponse, ApiResponse } from './config';

export const carsApi = {
  async list(): Promise<ApiResponse<any[]>> {
    try {
      const res = await fetch(getApiUrl('/api/cars'), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async get(id: string): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl(`/api/cars/${id}`), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async create(payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl('/api/cars'), {
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
      const res = await fetch(getApiUrl(`/api/cars/${id}`), {
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
      const res = await fetch(getApiUrl(`/api/cars/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  }
};

