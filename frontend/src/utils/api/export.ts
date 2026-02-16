import { getApiUrl } from './config';

const getExportHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Export as an object similar to other API modules
export const exportApi = {
  /**
   * Eksport raport për kandidat specifik
   */
  async exportCandidateReport(candidateId: string, format: 'excel' | 'csv' | 'pdf'): Promise<void> {
    const queryParams = new URLSearchParams();
    queryParams.append('candidateId', candidateId);
    queryParams.append('format', format);
    
    const response = await fetch(`${getApiUrl('/api/export/candidate')}?${queryParams.toString()}`, {
      method: 'GET',
      headers: getExportHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export candidate report');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const extension = format === 'excel' ? 'xlsx' : format;
    link.download = `raport-kandidat-${candidateId}-${new Date().toISOString().split('T')[0]}.${extension}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Eksport raport për instruktor specifik
   */
  async exportInstructorReport(instructorId: string, format: 'excel' | 'csv' | 'pdf'): Promise<void> {
    const queryParams = new URLSearchParams();
    queryParams.append('instructorId', instructorId);
    queryParams.append('format', format);
    
    const response = await fetch(`${getApiUrl('/api/export/instructor')}?${queryParams.toString()}`, {
      method: 'GET',
      headers: getExportHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export instructor report');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const extension = format === 'excel' ? 'xlsx' : format;
    link.download = `raport-instruktor-${instructorId}-${new Date().toISOString().split('T')[0]}.${extension}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
