import React, { useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Select } from './Select';
import { toast } from '../../hooks/useToast';
import { useLanguage } from '../../hooks/useLanguage';
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
  const { t } = useLanguage();
  const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (type === 'candidate') {
        if (!selectedCandidateId) {
          toast('error', t('reports.selectCandidateRequired'));
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
          toast('error', t('reports.selectInstructorRequired'));
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
      
      toast('success', t('reports.exportSuccess'));
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast('error', t('reports.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const getTitle = () => {
    if (type === 'candidate') {
      return t('reports.exportReportForCandidate');
    }
    return t('reports.exportReportForInstructor');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="md">
      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('reports.exportFormat')}
          </label>
          <Select
            value={format}
            onChange={(e) => setFormat(e.target.value as 'excel' | 'csv' | 'pdf')}
            placeholder={t('common.selectOption')}
            options={[
              { value: 'excel', label: t('reports.excel') },
              { value: 'csv', label: t('reports.csv') },
              { value: 'pdf', label: t('reports.pdf') }
            ]}
          />
        </div>

        {/* Candidate Selection */}
        {type === 'candidate' && candidates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('reports.selectCandidate')}
            </label>
            <Select
              value={selectedCandidateId || ""}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              placeholder={t('common.selectOption')}
              options={candidates.map(candidate => ({
                value: candidate.id,
                label: `${candidate.uniqueClientNumber ? candidate.uniqueClientNumber + ' - ' : ''}${candidate.firstName} ${candidate.lastName}`
              }))}
            />
          </div>
        )}

        {/* Instructor Selection */}
        {type === 'instructor' && instructors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('reports.selectInstructor')}
            </label>
            <Select
              value={selectedInstructorId || ""}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
              placeholder={t('common.selectOption')}
              options={instructors.map(inst => ({
                value: inst.id,
                label: `${inst.firstName || inst.user?.firstName || ''} ${inst.lastName || inst.user?.lastName || ''}`.trim() || t('instructors.instructor')
              }))}
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
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || (type === 'candidate' && !selectedCandidateId) || (type === 'instructor' && !selectedInstructorId)}
            icon={<DownloadIcon className="w-4 h-4" />}
          >
            {isExporting ? t('reports.exporting') : t('reports.export')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

