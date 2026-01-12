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

      const res = await fetch(getApiUrl(`/api/notifications?${params.toString()}`), {
        headers: getAuthHeaders()
      });
      return handleResponse<NotificationsResponse>(res);
    } catch (err) {
      console.error('Get notifications error:', err);
      return { ok: false, status: 500 };
    }
  },

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const res = await fetch(getApiUrl('/api/notifications/unread-count'), {
        headers: getAuthHeaders()
      });
      return handleResponse<{ count: number }>(res);
    } catch (err) {
      console.error('Get unread count error:', err);
      return { ok: false, status: 500 };
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

