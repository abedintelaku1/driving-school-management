const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ApiResponse<T> = {
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

async function handle<T>(res: Response): Promise<ApiResponse<T>> {
  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    return { ok: false, data, status: res.status };
  }
  return { ok: true, data, status: res.status };
}

export const api = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      const url = `${API_URL}/api/auth/login`;
      console.log('Login request to:', url);
      console.log('Login payload:', { email, password: '***' });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      console.log('Login response status:', res.status);
      console.log('Login response ok:', res.ok);
      
      const result = await handle<{ user: any; token: string }>(res);
      console.log('Login result:', { ok: result.ok, hasData: !!result.data, hasToken: !!result.data?.token });
      
      if (result.ok && result.data?.token) {
        localStorage.setItem(tokenKey, result.data.token);
      }
      return result;
    } catch (err) {
      console.error('Login error:', err);
      return { ok: false, status: 500, data: { message: 'Network error or server unavailable' } };
    }
  },
  async me(): Promise<ApiResponse<{ user: any }>> {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: getAuthHeaders()
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },
  clearToken() {
    localStorage.removeItem(tokenKey);
  },

  async listAppointments(): Promise<ApiResponse<any[]>> {
    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        headers: getAuthHeaders()
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async createAppointment(payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async updateAppointment(id: string, payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/appointments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async deleteAppointment(id: string): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/appointments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async listCandidates(): Promise<ApiResponse<any[]>> {
    try {
      const res = await fetch(`${API_URL}/api/candidates`, {
        headers: getAuthHeaders()
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },
  async createCandidate(payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/candidates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },
  async updateCandidate(id: string, payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/candidates/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },
  async getCandidate(id: string): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/candidates/${id}`, {
        headers: getAuthHeaders()
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async listCars(): Promise<ApiResponse<any[]>> {
    try {
      const res = await fetch(`${API_URL}/api/cars`, {
        headers: getAuthHeaders()
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },
  async createCar(payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/cars`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },
  async updateCar(id: string, payload: any): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/cars/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },
  async deleteCar(id: string): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/cars/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async listInstructors(): Promise<ApiResponse<any[]>> {
    try {
      const res = await fetch(`${API_URL}/api/instructors`, {
        headers: getAuthHeaders()
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async getInstructorMe(): Promise<ApiResponse<any>> {
    try {
      const res = await fetch(`${API_URL}/api/instructors/me`, {
        headers: getAuthHeaders()
      });
      return handle(res);
    } catch {
      return { ok: false, status: 500 };
    }
  }
};


