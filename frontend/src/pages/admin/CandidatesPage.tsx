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
import type { Package } from '../../types';
import type { Candidate, Car } from '../../types';
import { toast } from '../../hooks/useToast';
import { api } from '../../utils/api';
export function CandidatesPage() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<Candidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [packageFilter, setPackageFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
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
            name: `${ins.user?.firstName || ''} ${ins.user?.lastName || ''}`.trim() || ins.user?.email || 'Instructor',
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
          toast('error', 'Dështoi ngarkimi i instruktorëve');
        }
      } catch (err) {
        console.error(err);
        toast('error', 'Dështoi ngarkimi i instruktorëve');
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
        toast('error', 'Dështoi ngarkimi i paketave');
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
        toast('error', 'Dështoi ngarkimi i makinave');
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
        const errorMessage = (resp.data as any)?.message || 'Dështoi fshirja e kandidatit';
        toast('error', errorMessage);
        return;
      }
      toast('success', 'Kandidati u fshi me sukses');
      setRefreshKey(prev => prev + 1);
      setDeletingCandidate(null);
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast('error', 'Ndodhi një gabim. Ju lutemi provoni përsëri.');
    } finally {
      setIsDeleting(false);
    }
  };
  const handleExport = () => {
    if (!filteredCandidates.length) {
      toast('info', 'Nuk ka kandidatë për eksport');
      return;
    }

    const headers = ['Emri', 'Mbiemri', 'Email', 'Telefon', 'Paketa', 'Instruktori', 'Statusi'];
    const rows = filteredCandidates.map(c => {
      const pkg = c.packageId ? getPackageById(c.packageId) : null;
      const packageName = pkg ? pkg.name : 'Pa caktuar';
      
      const instructor = c.instructorId ? instructors.find(i => i.id === c.instructorId) : null;
      const instructorName = instructor ? instructor.name : 'Pa caktuar';
      
      return [
        c.firstName || '',
        c.lastName || '',
        c.email || '',
        c.phone || '',
        packageName,
        instructorName,
        c.status || ''
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'candidates.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast('success', 'Kandidatët u eksportuan në CSV');
  };
  const clearFilters = () => {
    setStatusFilter('');
    setPackageFilter('');
    setSearchQuery('');
  };
  const hasActiveFilters = !!(statusFilter || packageFilter || searchQuery);
  const columns = [{
    key: 'name',
    label: 'Kandidati',
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
    label: 'Kontakti',
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
    label: 'Paketa',
    render: (value: unknown) => {
      const pkg = value ? getPackageById(value as string) : null;
      return pkg ? <Badge variant="info" size="sm">
            {pkg.name}
          </Badge> : <span className="text-xs sm:text-sm text-gray-400">Pa caktuar</span>;
    }
  }, {
    key: 'instructorId',
    label: 'Instruktori',
    hideOnMobile: true,
    render: (value: unknown) => {
      const instructor = instructors.find(i => i.id === value);
      return instructor ? <span className="text-sm text-gray-700">
            {instructor.name}
          </span> : <span className="text-sm text-gray-400">Pa caktuar</span>;
    }
  }, {
    key: 'status',
    label: 'Statusi',
    sortable: true,
    render: (value: unknown) => <StatusBadge status={value as 'active' | 'inactive'} />
  }];
  const handleRowClick = (candidate: Candidate) => {
    navigate(`/admin/candidates/${candidate.id}`);
  };
  const actions = (candidate: Candidate) => <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/candidates/${candidate.id}`)} icon={<EyeIcon className="w-4 h-4" />} className="hidden sm:flex">
        Shiko
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setEditingCandidate(candidate)} icon={<EditIcon className="w-4 h-4" />}>
        <span className="hidden sm:inline">Ndrysho</span>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setDeletingCandidate(candidate)} 
        icon={<TrashIcon className="w-4 h-4" />}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <span className="hidden sm:inline">Fshi</span>
      </Button>
    </div>;
  return <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Kandidatët
          </h1>
          <p className="text-sm lg:text-base text-gray-500 mt-1">
            Menaxhoni kandidatët e shkollës së makinës ({filteredCandidates.length} gjithsej)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} icon={<DownloadIcon className="w-4 h-4" />} className="hidden sm:flex">
            Eksporto
          </Button>
          <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />} size="sm" className="flex-1 sm:flex-none">
            Shto kandidat
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Kërko sipas emrit, emailit, telefonit ose ID..." />

      {/* Filters */}
      <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <div className="w-full sm:w-48">
          <Select placeholder="Të gjitha statuset" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{
          value: '',
          label: 'Të gjitha statuset'
        }, {
          value: 'active',
          label: 'Aktive'
        }, {
          value: 'inactive',
          label: 'Joaktive'
        }]} />
        </div>
        <div className="w-full sm:w-48">
          <Select placeholder="Të gjitha paketat" value={packageFilter} onChange={e => setPackageFilter(e.target.value)} options={[{
          value: '',
          label: 'Të gjitha paketat'
        }, ...packages.map(pkg => ({
          value: pkg.id,
          label: pkg.name
        }))]} />
        </div>
      </FilterBar>

      {/* Table */}
      <Card padding="none">
        <DataTable data={filteredCandidates} columns={columns} keyExtractor={candidate => candidate.id} searchable={false} onRowClick={handleRowClick} actions={actions} emptyMessage="Nuk u gjetën kandidatë" />
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
        title="Fshi kandidatin"
        message={deletingCandidate ? `Jeni të sigurt që dëshironi të fshini ${deletingCandidate.firstName} ${deletingCandidate.lastName}? Ky veprim nuk mund të kthehet.` : ''}
        confirmText="Fshi"
        cancelText="Anulo"
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
      newErrors.firstName = 'Emri është i detyrueshëm';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Mbiemri është i detyrueshëm';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Emaili është i detyrueshëm';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Vendosni një adresë email të vlefshme';
      }
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Numri i telefonit është i detyrueshëm';
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]{6,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Vendosni një numër telefoni të vlefshëm';
      }
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Adresa është e detyrueshme';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Data e lindjes është e detyrueshme';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.dateOfBirth = 'Data e lindjes duhet të jetë në të kaluarën';
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      if (actualAge < 16) {
        newErrors.dateOfBirth = 'Kandidati duhet të jetë të paktën 16 vjeç';
      }
    }
    
    if (!formData.personalNumber.trim()) {
      newErrors.personalNumber = 'Numri personal është i detyrueshëm';
    } else if (formData.personalNumber.trim().length < 6) {
      newErrors.personalNumber = 'Numri personal duhet të ketë të paktën 6 karaktere';
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
          firstName: 'Emri',
          lastName: 'Mbiemri',
          email: 'Emaili',
          phone: 'Telefoni',
          address: 'Adresa',
          dateOfBirth: 'Data e lindjes',
          personalNumber: 'Numri personal'
        };
        const fieldLabel = fieldLabels[field] || field;
        return `${fieldLabel}: ${validationErrors[field]}`;
      }
    }
    
    const firstKey = errorKeys[0];
    const fieldLabels: Record<string, string> = {
      firstName: 'Emri',
      lastName: 'Mbiemri',
      email: 'Emaili',
      phone: 'Telefoni',
      address: 'Adresa',
      dateOfBirth: 'Data e lindjes',
      personalNumber: 'Numri personal'
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
        toast('error', 'Ju lutemi korrigjoni gabimet në formular');
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
        const errorMessage = (resp.data as any)?.message || 'Dështoi ruajtja e kandidatit';
        console.error('API Error Response:', resp.data);
        toast('error', errorMessage);
        return;
      }
      toast('success', candidate ? 'Kandidati u përditësua me sukses' : 'Kandidati u shtua me sukses');
      
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
      toast('error', 'Ndodhi një gabim. Ju lutemi provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={candidate ? 'Ndrysho kandidatin' : 'Shto kandidat të ri'} description="Vendosni të dhënat e kandidatit për ta regjistruar në sistem." size="lg"       footer={<div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth className="sm:w-auto">
            Anulo
          </Button>
          <Button onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)} loading={loading} fullWidth className="sm:w-auto">
            {candidate ? 'Ruaj ndryshimet' : 'Krijo kandidatin'}
          </Button>
        </div>}>
      <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Emri" 
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
            label="Mbiemri" 
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
            label="Emaili" 
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
            label="Telefoni" 
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
            label="Data e lindjes" 
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
            label="Numri personal" 
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
          label="Adresa" 
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
          <Select label="Paketa" value={formData.packageId} onChange={e => setFormData({
          ...formData,
          packageId: e.target.value
        })} options={packages.filter((p: Package) => p.status === 'active').map((pkg: Package) => ({
          value: pkg.id,
          label: `${pkg.name} - €${pkg.price}`
        }))} />
          <Select label="Instruktori" value={formData.instructorId} onChange={e => {
          setFormData({
            ...formData,
            instructorId: e.target.value,
            carId: '' // Clear car selection when instructor changes
          });
        }} options={[
          { value: '', label: 'Pa caktuar' },
          ...instructors.map(instructor => ({
            value: instructor.id,
            label: instructor.name
          }))
        ]} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select 
            label="Makina" 
            value={formData.carId} 
            onChange={e => setFormData({
              ...formData,
              carId: e.target.value
            })} 
            options={[
              { value: '', label: formData.instructorId && availableCars.length === 0 ? 'Nuk i janë caktuar makina këtij instruktori' : 'Pa caktuar' },
              ...availableCars.map(car => ({
                value: car.id,
                label: `${car.model} (${car.licensePlate})`
              }))
            ]}
            disabled={formData.instructorId && availableCars.length === 0}
            hint={formData.instructorId && availableCars.length === 1 ? 'U zgjidh automatikisht: vetëm një makinë i është caktuar këtij instruktori' : undefined}
          />
          <Select label="Frekuenca e pagesës" value={formData.paymentFrequency} onChange={e => setFormData({
          ...formData,
          paymentFrequency: e.target.value
        })} options={[{
          value: 'deposit',
label: 'Depozitë'
          }, {
            value: 'one-time',
          label: 'Pagesë një herë'
          }, {
            value: 'installments',
          label: 'Këste'
          }]} />
        </div>

        {candidate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select 
              label="Statusi" 
              value={formData.status} 
              onChange={e => setFormData({
                ...formData,
                status: e.target.value as 'active' | 'inactive'
              })} 
              options={[
                { value: 'active', label: 'Aktive' },
                { value: 'inactive', label: 'Joaktive' }
              ]} 
            />
          </div>
        )}
      </form>
    </Modal>;
}