import { getApiUrl, handleResponse, ApiResponse } from './config';
import type { Document } from '../../types';

const tokenKey = 'auth_token';

const getAuthHeaders = (includeContentType = true) => {
  const token = localStorage.getItem(tokenKey);
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const documentsApi = {
  async upload(candidateId: string, file: File, name?: string): Promise<ApiResponse<{ document: Document }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (name) {
        formData.append('name', name);
      }

      const token = localStorage.getItem(tokenKey);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(getApiUrl(`/api/documents/candidate/${candidateId}/upload`), {
        method: 'POST',
        headers,
        body: formData
      });
      
      // Handle response
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { 
          ok: false, 
          status: res.status,
          data: data
        };
      }
      return { ok: true, data, status: res.status };
    } catch (error) {
      console.error('Upload error:', error);
      return { 
        ok: false, 
        status: 500,
        data: { message: 'Gabim në rrjet. Ju lutem kontrolloni lidhjen tuaj.' }
      };
    }
  },

  async list(candidateId: string): Promise<ApiResponse<Document[]>> {
    try {
      const res = await fetch(getApiUrl(`/api/documents/candidate/${candidateId}`), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async get(candidateId: string, documentId: string): Promise<ApiResponse<Document>> {
    try {
      const res = await fetch(getApiUrl(`/api/documents/candidate/${candidateId}/${documentId}`), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async download(candidateId: string, documentId: string): Promise<void> {
    try {
      const token = localStorage.getItem(tokenKey);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(getApiUrl(`/api/documents/candidate/${candidateId}/${documentId}/download`), {
        headers
      });
      
      if (!res.ok) {
        throw new Error('Failed to download document');
      }

      // Get content type and filename from headers
      const contentType = res.headers.get('Content-Type') || 'application/pdf';
      const contentDisposition = res.headers.get('Content-Disposition');
      
      let filename = 'document.pdf';
      if (contentDisposition) {
        // Try to extract filename from Content-Disposition header
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          // Decode URI component if needed
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // If decoding fails, use as is
          }
        }
      }
      
      // Create blob with proper type
      const blob = await res.blob();
      const blobWithType = new Blob([blob], { type: contentType });
      
      // Create download link
      const url = window.URL.createObjectURL(blobWithType);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },

  async delete(candidateId: string, documentId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const res = await fetch(getApiUrl(`/api/documents/candidate/${candidateId}/${documentId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  },

  async update(candidateId: string, documentId: string, name: string): Promise<ApiResponse<{ document: Document }>> {
    try {
      const res = await fetch(getApiUrl(`/api/documents/candidate/${candidateId}/${documentId}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      return handleResponse(res);
    } catch {
      return { ok: false, status: 500 };
    }
  }
};

