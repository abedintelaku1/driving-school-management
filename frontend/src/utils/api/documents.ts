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

      const url = getApiUrl(`/api/documents/candidate/${candidateId}/${documentId}/download`);
      
      let res: Response;
      try {
        res = await fetch(url, {
          headers
        });
      } catch (fetchError) {
        // Handle network errors (server not running, CORS, etc.)
        console.error('Network error during download:', fetchError);
        throw new Error('Network error: Unable to connect to server. Please check if the backend server is running.');
      }
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        let errorMessage = `Failed to download document (Status: ${res.status})`;
        
        // Only try to parse JSON if there's actual content
        if (errorText && errorText.trim()) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message && errorData.message !== 'OK') {
              errorMessage = errorData.message;
            }
          } catch {
            // If response is not JSON, check if it's a meaningful error message
            if (errorText !== 'OK' && errorText.length > 0) {
              errorMessage = errorText;
            }
          }
        }
        
        // Don't use statusText if it's just "OK" - use a more descriptive message
        if (res.statusText && res.statusText !== 'OK') {
          errorMessage = `${errorMessage} - ${res.statusText}`;
        }
        
        throw new Error(errorMessage);
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
      let blob: Blob;
      try {
        blob = await res.blob();
      } catch (blobError) {
        console.error('Error reading response as blob:', blobError);
        throw new Error('Failed to read document data. The file may be corrupted or the server response is invalid.');
      }
      
      // Check if blob is empty
      if (blob.size === 0) {
        throw new Error('The document file is empty. Please try uploading the document again.');
      }
      
      const blobWithType = new Blob([blob], { type: contentType });
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blobWithType);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Error downloading document:', error);
      // Re-throw with more context if it's not already an Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while downloading the document');
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

