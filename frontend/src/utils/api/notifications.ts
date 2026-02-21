import { getApiUrl, getAuthHeaders, handleResponse, ApiResponse } from './config';

export type Notification = {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  relatedEntity: 'candidate' | 'appointment' | 'payment' | 'instructor' | 'system';
  relatedEntityId?: string;
  createdAt: string;
};

export type NotificationsResponse = {
  notifications: Notification[];
  total: number;
  unread: number;
};

export const notificationsApi = {
  async getAll(read?: boolean, limit = 50, skip = 0): Promise<ApiResponse<NotificationsResponse>> {
    try {
      const params = new URLSearchParams();
      if (read !== undefined) params.append('read', read.toString());
      params.append('limit', limit.toString());
      params.append('skip', skip.toString());

      const apiUrl = getApiUrl(`/api/notifications?${params.toString()}`);
      
      // Check if API URL is configured
      if (!apiUrl || apiUrl.startsWith('/api/')) {
        // API URL not configured - return empty result silently
        return { ok: true, data: { notifications: [], total: 0, unread: 0 }, status: 200 };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const res = await fetch(apiUrl, {
        headers: getAuthHeaders(),
        signal: controller.signal
      }).catch((fetchError) => {
        // Handle network errors silently - server might not be running
        clearTimeout(timeoutId);
        return null;
      });
      
      clearTimeout(timeoutId);
      
      if (!res) {
        // Network error - return empty result instead of error
        return { ok: true, data: { notifications: [], total: 0, unread: 0 }, status: 200 };
      }
      
      return handleResponse<NotificationsResponse>(res);
    } catch (err) {
      // Silently handle errors - return empty result instead of error
      return { ok: true, data: { notifications: [], total: 0, unread: 0 }, status: 200 };
    }
  },

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const apiUrl = getApiUrl('/api/notifications/unread-count');
      
      // Check if API URL is configured
      if (!apiUrl || apiUrl === '/api/notifications/unread-count') {
        // API URL not configured - return 0 count silently
        return { ok: true, data: { count: 0 }, status: 200 };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const res = await fetch(apiUrl, {
        headers: getAuthHeaders(),
        signal: controller.signal
      }).catch((fetchError) => {
        // Handle network errors silently - server might not be running
        clearTimeout(timeoutId);
        return null;
      });
      
      clearTimeout(timeoutId);
      
      if (!res) {
        // Network error - return 0 count instead of error
        return { ok: true, data: { count: 0 }, status: 200 };
      }
      
      return handleResponse<{ count: number }>(res);
    } catch (err) {
      // Silently handle errors - return 0 count instead of error
      // This includes AbortError from timeout
      return { ok: true, data: { count: 0 }, status: 200 };
    }
  },

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    try {
      const res = await fetch(getApiUrl(`/api/notifications/${id}/read`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return handleResponse<Notification>(res);
    } catch (err) {
      console.error('Mark as read error:', err);
      return { ok: false, status: 500 };
    }
  },

  async markAllAsRead(): Promise<ApiResponse<{ message: string; modifiedCount: number }>> {
    try {
      const res = await fetch(getApiUrl('/api/notifications/read-all'), {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return handleResponse<{ message: string; modifiedCount: number }>(res);
    } catch (err) {
      console.error('Mark all as read error:', err);
      return { ok: false, status: 500 };
    }
  },

  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const res = await fetch(getApiUrl(`/api/notifications/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse<{ message: string }>(res);
    } catch (err) {
      console.error('Delete notification error:', err);
      return { ok: false, status: 500 };
    }
  }
};

