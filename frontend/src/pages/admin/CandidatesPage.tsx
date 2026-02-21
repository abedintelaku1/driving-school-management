import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, EyeIcon, EditIcon, DownloadIcon, MailIcon, PhoneIcon, TrashIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FilterBar } from '../../components/ui/FilterBar';
import { SearchBar } from '../../components/ui/SearchBar';
import { useLanguage } from '../../hooks/useLanguage';
import type { Package } from '../../types';
import type { Candidate, Car } from '../../types';
import { toast } from '../../hooks/useToast';
import { api } from '../../utils/api';
import jsPDF from 'jspdf';

// Helper function to translate package names
const getTranslatedPackageName = (packageName: string, t: (key: string) => string): string => {
  const nameLower = packageName.toLowerCase();
  
  // Map common package names to translation keys
  if (nameLower.includes('premium')) {
    return t('packages.premium');
  }
  if (nameLower.includes('standard')) {
    return t('packages.standard');
  }
  if (nameLower.includes('basic')) {
    return t('packages.basic');
  }
  
  // If no match found, return original name
  return packageName;
};

export function CandidatesPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [packageFilter, setPackageFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [instructors, setInstructors] = useState<{ id: string; name: string; assignedCarIds?: string[] }[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const { ok, data } = await api.listInstructors();
        if (ok && data) {
          const opts = (data as any[]).map((ins: any) => ({
            id: ins._id || ins.id,
            name: `${ins.user?.firstName || ''} ${ins.user?.lastName || ''}`.trim() || ins.user?.email || t('common.roleInstructor'),
            assignedCarIds: (ins.assignedCarIds || []).map((id: any) => {
              // Handle both ObjectId objects and string IDs
              if (typeof id === "object" && id !== null && id._id) {
                return id._id.toString();
              }
              return id?.toString() || id;
            })
          }));
          setInstructors(opts);
        } else {
          toast('error', t('candidates.failedToLoadInstructors'));
        }
      } catch (err) {
        console.error(err);
        toast('error', t('candidates.failedToLoadInstructors'));
      }
    };
    fetchInstructors();
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { ok, data } = await api.listPackages();
        if (ok && data) {
          const mapped = (data as any[]).map(item => ({
            id: item._id || item.id,
            name: item.name,
            category: item.category,
            numberOfHours: item.numberOfHours,
            price: item.price,
            description: item.description || '',
            status: item.status || 'active',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString()
          }));
          setPackages(mapped as Package[]);
        }
      } catch (error) {
        console.error('Failed to load packages:', error);
        toast('error', t('candidates.failedToLoadPackages'));
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const { ok, data } = await api.listCars();
        if (ok && data) {
          const mapped = (data as any[]).map(item => ({
            id: item._id || item.id,
            model: item.model,
            yearOfManufacture: item.yearOfManufacture,
            chassisNumber: item.chassisNumber,
            transmission: item.transmission,
            fuelType: item.fuelType,
            licensePlate: item.licensePlate,
            ownership: item.ownership,
            registrationExpiry: item.registrationExpiry ? (item.registrationExpiry instanceof Date ? item.registrationExpiry.toISOString().split('T')[0] : item.registrationExpiry.split('T')[0]) : '',
            lastInspection: item.lastInspection ? (item.lastInspection instanceof Date ? item.lastInspection.toISOString().split('T')[0] : item.lastInspection.split('T')[0]) : '',
            nextInspection: item.nextInspection ? (item.nextInspection instanceof Date ? item.nextInspection.toISOString().split('T')[0] : item.nextInspection.split('T')[0]) : '',
            totalHours: item.totalHours || 0,
            status: item.status || 'active',
            createdAt: item.createdAt ? (item.createdAt instanceof Date ? item.createdAt.toISOString().split('T')[0] : item.createdAt.split('T')[0]) : '',
            updatedAt: item.updatedAt ? (item.updatedAt instanceof Date ? item.updatedAt.toISOString().split('T')[0] : item.updatedAt.split('T')[0]) : ''
          }));
          setCars(mapped as Car[]);
        }
      } catch (error) {
        console.error('Failed to load cars:', error);
        toast('error', t('cars.failedToLoad'));
      }
    };
    fetchCars();
  }, []);
  useEffect(() => {
    const fetchCandidates = async () => {
      const { ok, data } = await api.listCandidates();
      if (ok && data) {
        const mapped = (data as any[]).map(item => {
          // Format dateOfBirth if it's a Date object
          let dateOfBirth = item.dateOfBirth;
          if (dateOfBirth instanceof Date) {
            dateOfBirth = dateOfBirth.toISOString().split('T')[0];
          } else if (typeof dateOfBirth === 'string' && dateOfBirth.includes('T')) {
            dateOfBirth = dateOfBirth.split('T')[0];
          }
          
          return {
          id: item._id || item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          phone: item.phone,
            dateOfBirth: dateOfBirth || '',
          personalNumber: item.personalNumber,
          address: item.address,
            packageId: item.packageId?._id || item.packageId || '',
          carId: item.carId || '',
          paymentFrequency: item.paymentFrequency || '',
          status: item.status || 'active',
            instructorId: item.instructorId?._id || item.instructorId || item.instructor?._id || item.instructor || '',
            uniqueClientNumber: item.uniqueClientNumber || '',
            documents: item.documents || [],
            createdAt: item.createdAt ? (item.createdAt instanceof Date ? item.createdAt.toISOString().split('T')[0] : item.createdAt.split('T')[0]) : '',
            updatedAt: item.updatedAt ? (item.updatedAt instanceof Date ? item.updatedAt.toISOString().split('T')[0] : item.updatedAt.split('T')[0]) : ''
          };
        });
        setCandidates(mapped as Candidate[]);
      }
    };
    fetchCandidates();
  }, [refreshKey]);

  const getPackageById = (id: string): Package | null => {
    return packages.find(p => p.id === id) || null;
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      if (statusFilter && candidate.status !== statusFilter) return false;
      if (packageFilter && candidate.packageId !== packageFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return candidate.firstName.toLowerCase().includes(query) || candidate.lastName.toLowerCase().includes(query) || candidate.email.toLowerCase().includes(query) || candidate.uniqueClientNumber.toLowerCase().includes(query) || candidate.phone.toLowerCase().includes(query);
      }
      return true;
    });
  }, [statusFilter, packageFilter, searchQuery, refreshKey, candidates]);
  const handleAddSuccess = () => {
    setRefreshKey(prev => prev + 1);
    // Toast message is already shown in handleSubmit
  };
  const handleEditSuccess = () => {
    setRefreshKey(prev => prev + 1);
    // Toast message is already shown in handleSubmit
  };
  const handleDelete = async () => {
    if (!deletingCandidate) return;
    
    setIsDeleting(true);
    try {
      const resp = await api.deleteCandidate(deletingCandidate.id);
      if (!resp.ok) {
        const errorMessage = (resp.data as any)?.message || t('candidates.failedToDelete');
        toast('error', errorMessage);
        return;
      }
      toast('success', t('candidates.candidateDeleted'));
      setRefreshKey(prev => prev + 1);
      setDeletingCandidate(null);
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast('error', t('common.somethingWentWrong'));
    } finally {
      setIsDeleting(false);
    }
  };
  const handleExport = () => {
    if (!filteredCandidates.length) {
      toast('info', t('candidates.noCandidatesToExport'));
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (exportFormat === 'csv') {
      const headers = [t('candidates.firstName'), t('candidates.lastName'), t('common.email'), t('common.phone'), t('candidates.packageColumn'), t('candidates.instructorColumn'), t('candidates.statusColumn')];
      const rows = filteredCandidates.map(c => {
        const pkg = c.packageId ? getPackageById(c.packageId) : null;
        const packageName = pkg ? getTranslatedPackageName(pkg.name, t) : t('candidates.notAssigned');
        
        const instructor = c.instructorId ? instructors.find(i => i.id === c.instructorId) : null;
        const instructorName = instructor ? instructor.name : t('candidates.notAssigned');
        
        return [
          c.firstName || '',
          c.lastName || '',
          c.email || '',
          c.phone || '',
          packageName,
          instructorName,
          c.status === 'active' ? t('common.active') : t('common.inactive')
        ];
      });

      const csv = [headers, ...rows]
        .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('candidates.csvFilename')}_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast('success', t('candidates.exportedToCSV'));
    } else {
      // PDF Export
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('candidates.title'), 14, 20);
      doc.setFontSize(10);
      const localeMap: Record<string, string> = { sq: 'sq-AL', en: 'en-US', sr: 'sr-RS' };
      const locale = localeMap[language] || 'sq-AL';
      doc.text(`${t('common.date')}: ${new Date().toLocaleDateString(locale)}`, 14, 30);
      doc.text(`${t('common.total')}: ${filteredCandidates.length} ${t('candidates.title').toLowerCase()}`, 14, 37);
      
      let yPos = 50;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(t('candidates.firstName'), 14, yPos);
      doc.text(t('candidates.lastName'), 50, yPos);
      doc.text(t('common.email'), 85, yPos);
      doc.text(t('common.phone'), 130, yPos);
      doc.text(t('candidates.packageColumn'), 160, yPos);
      doc.text(t('candidates.statusColumn'), 190, yPos);
      
      yPos += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      filteredCandidates.forEach((c) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const pkg = c.packageId ? getPackageById(c.packageId) : null;
        const packageName = pkg ? getTranslatedPackageName(pkg.name, t).substring(0, 15) : t('candidates.notAssigned');
        const instructor = c.instructorId ? instructors.find(i => i.id === c.instructorId) : null;
        
        doc.text((c.firstName || '').substring(0, 15), 14, yPos);
        doc.text((c.lastName || '').substring(0, 15), 50, yPos);
        doc.text((c.email || '').substring(0, 20), 85, yPos);
        doc.text((c.phone || '').substring(0, 12), 130, yPos);
        doc.text(packageName, 160, yPos);
        doc.text(c.status === 'active' ? t('common.active') : (c.status || ''), 190, yPos);
        yPos += 7;
      });
      
      doc.save(`${t('candidates.csvFilename')}_${timestamp}.pdf`);
      toast('success', t('candidates.exportedToPDF'));
    }
  };
  const clearFilters = () => {
    setStatusFilter('');
    setPackageFilter('');
    setSearchQuery('');
  };
  const hasActiveFilters = !!(statusFilter || packageFilter || searchQuery);
  const columns = [{
    key: 'name',
    label: t('candidates.candidateColumn'),
    sortable: true,
    render: (_: unknown, candidate: Candidate) => <div className="flex items-center gap-3">
          <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="sm" className="hidden sm:flex" />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {candidate.firstName} {candidate.lastName}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              {candidate.uniqueClientNumber}
            </p>
          </div>
        </div>
  }, {
    key: 'email',
    label: t('candidates.contactColumn'),
    hideOnMobile: true,
    render: (_: unknown, candidate: Candidate) => <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <MailIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="truncate">{candidate.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <PhoneIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="truncate">{candidate.phone}</span>
          </div>
        </div>
  }, {
    key: 'packageId',
    label: t('candidates.packageColumn'),
    render: (value: unknown) => {
      const pkg = value ? getPackageById(value as string) : null;
      return pkg ? <Badge variant="info" size="sm">
            {getTranslatedPackageName(pkg.name, t)}
          </Badge> : <span className="text-xs sm:text-sm text-gray-400">{t('candidates.notAssigned')}</span>;
    }
  }, {
    key: 'instructorId',
    label: t('candidates.instructorColumn'),
    hideOnMobile: true,
    render: (value: unknown) => {
      const instructor = instructors.find(i => i.id === value);
      return instructor ? <span className="text-sm text-gray-700">
            {instructor.name}
          </span> : <span className="text-sm text-gray-400">{t('candidates.notAssigned')}</span>;
    }
  }, {
    key: 'status',
    label: t('candidates.statusColumn'),
    sortable: true,
    render: (value: unknown) => <StatusBadge status={value as 'active' | 'inactive'} />
  }];
  const handleRowClick = (candidate: Candidate) => {
    navigate(`/admin/candidates/${candidate.id}`);
  };
  const actions = (candidate: Candidate) => <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/candidates/${candidate.id}`)} icon={<EyeIcon className="w-4 h-4" />} className="hidden sm:flex">
        {t('common.view')}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setEditingCandidate(candidate)} icon={<EditIcon className="w-4 h-4" />}>
        <span className="hidden sm:inline">{t('common.edit')}</span>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setDeletingCandidate(candidate)} 
        icon={<TrashIcon className="w-4 h-4" />}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <span className="hidden sm:inline">{t('common.delete')}</span>
      </Button>
    </div>;
  return <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            {t('candidates.title')}
          </h1>
          <p className="text-sm lg:text-base text-gray-500 mt-1">
            {t('candidates.subtitleWithCount').replace('{count}', filteredCandidates.length.toString())}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="hidden sm:flex gap-2 items-center">
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
              options={[
                { value: 'csv', label: t('reports.csv') },
                { value: 'pdf', label: t('reports.pdf') },
              ]}
              placeholder={t('common.selectOption')}
              className="w-24"
            />
            <Button variant="outline" size="sm" onClick={handleExport} icon={<DownloadIcon className="w-4 h-4" />}>
              {exportFormat === 'csv' ? t('candidates.exportCSV') : t('candidates.exportPDF')}
            </Button>
          </div>
          <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />} size="sm" className="flex-1 sm:flex-none">
            {t('candidates.addCandidate')}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t('candidates.searchPlaceholder')} />

      {/* Filters */}
      <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <div className="w-full sm:w-48">
          <Select placeholder={t('candidates.allStatuses')} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{
          value: '',
          label: t('candidates.allStatuses')
        }, {
          value: 'active',
          label: t('common.active')
        }, {
          value: 'inactive',
          label: t('common.inactive')
        }]} />
        </div>
        <div className="w-full sm:w-48">
          <Select placeholder={t('candidates.allPackages')} value={packageFilter} onChange={e => setPackageFilter(e.target.value)} options={[{
          value: '',
          label: t('candidates.allPackages')
        }, ...packages.map(pkg => {
          // Translate package name based on the name from backend
          const translatedName = getTranslatedPackageName(pkg.name, t);
          return {
            value: pkg.id,
            label: translatedName
          };
        })]} />
        </div>
      </FilterBar>

      {/* Table */}
      <Card padding="none">
        <DataTable data={filteredCandidates} columns={columns} keyExtractor={candidate => candidate.id} searchable={false} onRowClick={handleRowClick} actions={actions} emptyMessage={t('candidates.noCandidatesFound')} />
      </Card>

      {/* Add/Edit Modal */}
      <AddCandidateModal instructors={instructors} packages={packages} cars={cars} isOpen={showAddModal || !!editingCandidate} onClose={() => {
      setShowAddModal(false);
      setEditingCandidate(null);
    }} candidate={editingCandidate} onSuccess={() => {
      if (editingCandidate) {
        handleEditSuccess();
      } else {
        handleAddSuccess();
      }
      setShowAddModal(false);
      setEditingCandidate(null);
    }} />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingCandidate}
        onClose={() => setDeletingCandidate(null)}
        onConfirm={handleDelete}
        title={t('candidates.deleteCandidate')}
        message={deletingCandidate ? t('candidates.confirmDeleteMessage').replace('{name}', `${deletingCandidate.firstName} ${deletingCandidate.lastName}`) : ''}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        loading={isDeleting}
      />
    </div>;
}
type AddCandidateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  candidate?: Candidate | null;
  onSuccess: () => void;
  instructors: { id: string; name: string; assignedCarIds?: string[] }[];
  packages: Package[];
  cars: Car[];
};
function AddCandidateModal({
  isOpen,
  onClose,
  candidate,
  onSuccess,
  instructors,
  packages,
  cars
}: AddCandidateModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    personalNumber: '',
    address: '',
    packageId: '',
    instructorId: '',
    carId: '',
    paymentFrequency: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get available cars for selected instructor
  const availableCars = useMemo(() => {
    if (!formData.instructorId) {
      // If no instructor selected, show all active cars
      return cars.filter(c => c.status === 'active');
    }
    
    // Find the selected instructor
    const selectedInstructor = instructors.find(inst => inst.id === formData.instructorId);
    if (!selectedInstructor || !selectedInstructor.assignedCarIds || selectedInstructor.assignedCarIds.length === 0) {
      // If instructor has no assigned cars, return empty array
      return [];
    }
    
    // Filter cars that are assigned to this instructor
    return cars.filter(car => 
      car.status === 'active' && 
      selectedInstructor.assignedCarIds?.includes(car.id)
    );
  }, [formData.instructorId, instructors, cars]);
  
  // Auto-select car if instructor has exactly one assigned car
  useEffect(() => {
    if (!formData.instructorId) {
      // If no instructor selected, clear car selection (only when not editing)
      if (!candidate) {
        setFormData(prev => ({
          ...prev,
          carId: ''
        }));
      }
      return;
    }
    
    if (availableCars.length === 1) {
      // Auto-select the only available car (only when not editing or when editing and car is not set)
      if (!candidate || !formData.carId) {
        setFormData(prev => {
          if (prev.carId !== availableCars[0].id) {
            return {
              ...prev,
              carId: availableCars[0].id
            };
          }
          return prev;
        });
      }
    } else if (availableCars.length === 0) {
      // If instructor has no cars, clear car selection
      setFormData(prev => ({
        ...prev,
        carId: ''
      }));
    } else if (availableCars.length > 1) {
      // If instructor has multiple cars, check if current car is still available
      const currentCarStillAvailable = availableCars.some(car => car.id === formData.carId);
      if (!currentCarStillAvailable) {
        // Current car is not available for new instructor, clear it
        setFormData(prev => ({
          ...prev,
          carId: ''
        }));
      }
    }
  }, [formData.instructorId, availableCars, candidate]);

  // Validation function - returns errors object
  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('candidates.firstNameRequired');
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('candidates.lastNameRequired');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('candidates.emailRequired');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t('candidates.emailInvalid');
      }
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t('candidates.phoneRequired');
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]{6,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = t('candidates.phoneInvalid');
      }
    }
    
    if (!formData.address.trim()) {
      newErrors.address = t('candidates.addressRequired');
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('candidates.dateOfBirthRequired');
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.dateOfBirth = t('candidates.dateOfBirthMustBePast');
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      if (actualAge < 16) {
        newErrors.dateOfBirth = t('common.candidateMustBeAtLeast16');
      }
    }
    
    if (!formData.personalNumber.trim()) {
      newErrors.personalNumber = t('common.personalNumberRequired');
    } else if (formData.personalNumber.trim().length < 6) {
      newErrors.personalNumber = t('common.personalNumberMinLength');
    }
    
    setErrors(newErrors);
    return newErrors;
  };

  const getFirstErrorMessage = (validationErrors: Record<string, string>): string => {
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length === 0) return '';
    
    // Order of fields in the form (top to bottom)
    const fieldOrder = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'personalNumber', 'address'];
    
    // Find the first error according to form order
    for (const field of fieldOrder) {
      if (validationErrors[field]) {
        const fieldLabels: Record<string, string> = {
          firstName: t('candidates.firstName'),
          lastName: t('candidates.lastName'),
          email: t('candidates.email'),
          phone: t('candidates.phone'),
          address: t('candidates.address'),
          dateOfBirth: t('candidates.dateOfBirth'),
          personalNumber: t('candidates.personalNumber')
        };
        const fieldLabel = fieldLabels[field] || field;
        return `${fieldLabel}: ${validationErrors[field]}`;
      }
    }
    
    const firstKey = errorKeys[0];
    const fieldLabels: Record<string, string> = {
      firstName: t('candidates.firstName'),
      lastName: t('candidates.lastName'),
      email: t('candidates.email'),
      phone: t('candidates.phone'),
      address: t('candidates.address'),
      dateOfBirth: t('candidates.dateOfBirth'),
      personalNumber: t('candidates.personalNumber')
    };
    return `${fieldLabels[firstKey] || firstKey}: ${validationErrors[firstKey]}`;
  };

  useEffect(() => {
    if (candidate) {
      setFormData({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        dateOfBirth: candidate.dateOfBirth,
        personalNumber: candidate.personalNumber,
        address: candidate.address,
        packageId: candidate.packageId || '',
        instructorId: candidate.instructorId || '',
        carId: candidate.carId || '',
        paymentFrequency: candidate.paymentFrequency || '',
        status: candidate.status
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        personalNumber: '',
        address: '',
        packageId: '',
        instructorId: '',
        carId: '',
        paymentFrequency: '',
        status: 'active'
      });
    }
    // Clear errors when form data changes
    setErrors({});
  }, [candidate]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validate form before submitting
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const errorMessage = getFirstErrorMessage(validationErrors);
      if (errorMessage) {
        toast('error', errorMessage);
      } else {
        toast('error', t('candidates.pleaseFixFormErrors'));
      }
      return;
    }
    
    setLoading(true);
    try {
      // Helper function to check if string is a valid MongoDB ObjectId (24 hex characters)
      const isValidObjectId = (id: string | undefined): boolean => {
        if (!id || id.trim() === '') return false;
        // MongoDB ObjectId is 24 hex characters
        return /^[0-9a-fA-F]{24}$/.test(id);
      };
      
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        personalNumber: formData.personalNumber.trim(),
        address: formData.address.trim(),
        status: formData.status
      };
      
      // packageId is stored as string
      if (formData.packageId && formData.packageId.trim()) {
        payload.packageId = formData.packageId.trim();
      }
      
      // Only include instructorId if it's a valid ObjectId
      if (isValidObjectId(formData.instructorId)) {
        payload.instructorId = formData.instructorId;
      } else {
        payload.instructorId = null;
      }
      
      if (formData.carId && formData.carId.trim()) {
        payload.carId = formData.carId.trim();
      }
      
      if (formData.paymentFrequency && formData.paymentFrequency.trim()) {
        payload.paymentFrequency = formData.paymentFrequency.trim();
      }
      
      console.log('Sending payload:', payload);
      const resp = candidate ? await api.updateCandidate(candidate.id, payload) : await api.createCandidate(payload);
      if (!resp.ok) {
        const errorMessage = (resp.data as any)?.message || t('candidates.failedToSave');
        console.error('API Error Response:', resp.data);
        toast('error', errorMessage);
        return;
      }
      toast('success', candidate ? t('candidates.candidateUpdated') : t('candidates.candidateAdded'));
      
      // Reset form if creating new candidate (not editing)
      if (!candidate) {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          personalNumber: '',
          address: '',
          packageId: '',
          instructorId: '',
          carId: '',
          paymentFrequency: '',
          status: 'active'
        });
        setErrors({});
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving candidate:', error);
      toast('error', t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={candidate ? t('candidates.editCandidateTitle') : t('candidates.addCandidateTitle')} description={t('candidates.enterCandidateDetails')} size="lg"       footer={<div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth className="sm:w-auto">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)} loading={loading} fullWidth className="sm:w-auto">
            {candidate ? t('common.saveChanges') : t('candidates.createCandidate')}
          </Button>
        </div>}>
      <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label={t('candidates.firstName')} 
            required 
            value={formData.firstName} 
            error={errors.firstName}
            onChange={e => {
              setFormData({ ...formData, firstName: e.target.value });
              if (errors.firstName) {
                setErrors({ ...errors, firstName: '' });
              }
            }} 
          />
          <Input 
            label={t('candidates.lastName')} 
            required 
            value={formData.lastName} 
            error={errors.lastName}
            onChange={e => {
              setFormData({ ...formData, lastName: e.target.value });
              if (errors.lastName) {
                setErrors({ ...errors, lastName: '' });
              }
            }} 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label={t('candidates.email')} 
            type="email" 
            required 
            value={formData.email} 
            error={errors.email}
            onChange={e => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) {
                setErrors({ ...errors, email: '' });
              }
            }} 
          />
          <Input 
            label={t('candidates.phone')} 
            type="tel" 
            required 
            value={formData.phone} 
            error={errors.phone}
            onChange={e => {
              setFormData({ ...formData, phone: e.target.value });
              if (errors.phone) {
                setErrors({ ...errors, phone: '' });
              }
            }} 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label={t('candidates.dateOfBirth')} 
            type="date" 
            required 
            value={formData.dateOfBirth} 
            error={errors.dateOfBirth}
            onChange={e => {
              setFormData({ ...formData, dateOfBirth: e.target.value });
              if (errors.dateOfBirth) {
                setErrors({ ...errors, dateOfBirth: '' });
              }
            }} 
          />
          <Input 
            label={t('candidates.personalNumber')} 
            required 
            value={formData.personalNumber} 
            error={errors.personalNumber}
            onChange={e => {
              setFormData({ ...formData, personalNumber: e.target.value });
              if (errors.personalNumber) {
                setErrors({ ...errors, personalNumber: '' });
              }
            }} 
          />
        </div>

        <Input 
          label={t('candidates.address')} 
          required 
          value={formData.address} 
          error={errors.address}
          onChange={e => {
            setFormData({ ...formData, address: e.target.value });
            if (errors.address) {
              setErrors({ ...errors, address: '' });
            }
          }} 
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label={t('candidates.package')} value={formData.packageId} onChange={e => setFormData({
          ...formData,
          packageId: e.target.value
        })} options={packages.filter((p: Package) => p.status === 'active').map((pkg: Package) => {
          const translatedName = getTranslatedPackageName(pkg.name, t);
          return {
            value: pkg.id,
            label: `${translatedName} - €${pkg.price}`
          };
        })} />
          <Select label={t('candidates.instructor')} value={formData.instructorId} onChange={e => {
          setFormData({
            ...formData,
            instructorId: e.target.value,
            carId: '' // Clear car selection when instructor changes
          });
        }} options={[
          { value: '', label: t('candidates.notAssigned') },
          ...instructors.map(instructor => ({
            value: instructor.id,
            label: instructor.name
          }))
        ]} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select 
            label={t('candidates.car')} 
            value={formData.carId} 
            onChange={e => setFormData({
              ...formData,
              carId: e.target.value
            })} 
            options={[
              { value: '', label: formData.instructorId && availableCars.length === 0 ? t('candidates.noCarsAssignedToInstructor') : t('candidates.notAssigned') },
              ...availableCars.map(car => ({
                value: car.id,
                label: `${car.model} (${car.licensePlate})`
              }))
            ]}
            disabled={formData.instructorId && availableCars.length === 0}
            hint={formData.instructorId && availableCars.length === 1 ? t('candidates.carAutoSelected') : undefined}
          />
          <Select label={t('candidates.paymentFrequency')} value={formData.paymentFrequency} onChange={e => setFormData({
          ...formData,
          paymentFrequency: e.target.value
        })} options={[{
          value: 'deposit',
label: t('candidates.deposit')
          }, {
            value: 'one-time',
          label: t('candidates.oneTime')
          }, {
            value: 'installments',
          label: t('candidates.installments')
          }]} />
        </div>

        {candidate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select 
              label={t('candidates.status')} 
              value={formData.status} 
              onChange={e => setFormData({
                ...formData,
                status: e.target.value as 'active' | 'inactive'
              })} 
              options={[
                { value: 'active', label: t('common.active') },
                { value: 'inactive', label: t('common.inactive') }
              ]} 
            />
          </div>
        )}
      </form>
    </Modal>;
}