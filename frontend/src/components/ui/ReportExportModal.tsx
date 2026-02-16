import React, { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Select } from './Select';
import { toast } from '../../hooks/useToast';
import { api, exportApi } from '../../utils/api';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'candidate' | 'instructor';
  candidates?: Array<{ id: string; firstName: string; lastName: string; uniqueClientNumber?: string }>;
  instructors?: Array<{ id: string; firstName?: string; lastName?: string; user?: { firstName?: string; lastName?: string } }>;
}

export function ReportExportModal({
  isOpen,
  onClose,
  type,
  candidates = [],
  instructors = []
}: ReportExportModalProps) {
  const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (type === 'candidate') {
        if (!selectedCandidateId) {
          toast('error', 'Ju lutem zgjidhni një kandidat');
          setIsExporting(false);
          return;
        }
        
        // Use exportApi directly as fallback if api doesn't have it
        const exportFn = api.exportCandidateReport || exportApi.exportCandidateReport;
        if (typeof exportFn !== 'function') {
          console.error('exportCandidateReport is not a function', { api, exportApi });
          throw new Error('Export function not available');
        }
        
        await exportFn(selectedCandidateId, format);
      } else if (type === 'instructor') {
        if (!selectedInstructorId) {
          toast('error', 'Ju lutem zgjidhni një instruktor');
          setIsExporting(false);
          return;
        }
        
        // Use exportApi directly as fallback if api doesn't have it
        const exportFn = api.exportInstructorReport || exportApi.exportInstructorReport;
        if (typeof exportFn !== 'function') {
          console.error('exportInstructorReport is not a function', { api, exportApi });
          throw new Error('Export function not available');
        }
        
        await exportFn(selectedInstructorId, format);
      }
      
      toast('success', 'Eksportimi u krye me sukses');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast('error', 'Dështoi eksportimi');
    } finally {
      setIsExporting(false);
    }
  };

  const getTitle = () => {
    if (type === 'candidate') {
      return 'Eksporto Raport për Kandidat';
    }
    return 'Eksporto Raport për Instruktor';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="md">
      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format eksporti
          </label>
          <Select
            value={format}
            onChange={(e) => setFormat(e.target.value as 'excel' | 'csv' | 'pdf')}
            options={[
              { value: 'excel', label: 'Excel' },
              { value: 'csv', label: 'CSV' },
              { value: 'pdf', label: 'PDF' }
            ]}
          />
        </div>

        {/* Candidate Selection */}
        {type === 'candidate' && candidates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zgjidhni kandidatin
            </label>
            <Select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              options={[
                { value: '', label: 'Zgjidhni kandidatin...' },
                ...candidates.map(candidate => ({
                  value: candidate.id,
                  label: `${candidate.uniqueClientNumber ? candidate.uniqueClientNumber + ' - ' : ''}${candidate.firstName} ${candidate.lastName}`
                }))
              ]}
            />
          </div>
        )}

        {/* Instructor Selection */}
        {type === 'instructor' && instructors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zgjidhni instruktorin
            </label>
            <Select
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
              options={[
                { value: '', label: 'Zgjidhni instruktorin...' },
                ...instructors.map(inst => ({
                  value: inst.id,
                  label: `${inst.firstName || inst.user?.firstName || ''} ${inst.lastName || inst.user?.lastName || ''}`.trim() || 'Instruktor'
                }))
              ]}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isExporting}
          >
            Anulo
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || (type === 'candidate' && !selectedCandidateId) || (type === 'instructor' && !selectedInstructorId)}
            icon={<DownloadIcon className="w-4 h-4" />}
          >
            {isExporting ? 'Duke eksportuar...' : 'Eksporto'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

