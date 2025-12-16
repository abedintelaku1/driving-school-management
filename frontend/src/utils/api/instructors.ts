import { getApiUrl, getAuthHeaders, handleResponse, ApiResponse } from './config';

export const instructorsApi = {
  async list(): Promise<ApiResponse<any[]>> {
    try {
      const res = await fetch(getApiUrl('/api/instructors'), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async get(id: string): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl(`/api/instructors/${id}`), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async getMe(): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl('/api/instructors/me'), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async create(payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl('/api/instructors'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await handleResponse(res);
      if (!result.ok) {
        console.error('Create instructor error:', result.data);
      }
      return result;
    } catch (error) {
      console.error('Network error creating instructor:', error);
      return { ok: false, status: 500, data: { message: 'Network error. Please check your connection.' } };
    }
  },

  async update(id: string, payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(getApiUrl(`/api/instructors/${id}`), {
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
      const res = await fetch(getApiUrl(`/api/instructors/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  }
};

