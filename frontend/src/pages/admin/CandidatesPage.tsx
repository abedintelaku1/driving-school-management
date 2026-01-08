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
import { mockCars } from '../../utils/mockData';
import type { Package } from '../../types';
import type { Candidate } from '../../types';
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
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_URL}/api/instructors`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load instructors');
        const opts = (data || []).map((ins: any) => ({
          id: ins._id,
          name: `${ins.user?.firstName || ''} ${ins.user?.lastName || ''}`.trim() || ins.user?.email || 'Instructor'
        }));
        setInstructors(opts);
      } catch (err) {
        console.error(err);
        toast('error', 'Failed to load instructors');
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
        toast('error', 'Failed to load packages');
      }
    };
    fetchPackages();
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
        const errorMessage = (resp.data as any)?.message || 'Failed to delete candidate';
        toast('error', errorMessage);
        return;
      }
      toast('success', 'Candidate deleted successfully');
      setRefreshKey(prev => prev + 1);
      setDeletingCandidate(null);
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast('error', 'An error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  const handleExport = () => {
    if (!filteredCandidates.length) {
      toast('info', 'No candidates to export');
      return;
    }

    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Package', 'Instructor', 'Status'];
    const rows = filteredCandidates.map(c => {
      // Get package name
      const pkg = c.packageId ? getPackageById(c.packageId) : null;
      const packageName = pkg ? pkg.name : 'Not assigned';
      
      // Get instructor name
      const instructor = c.instructorId ? instructors.find(i => i.id === c.instructorId) : null;
      const instructorName = instructor ? instructor.name : 'Not assigned';
      
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
    toast('success', 'Exported candidates to CSV');
  };
  const clearFilters = () => {
    setStatusFilter('');
    setPackageFilter('');
    setSearchQuery('');
  };
  const hasActiveFilters = !!(statusFilter || packageFilter || searchQuery);
  const columns = [{
    key: 'name',
    label: 'Candidate',
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
    label: 'Contact',
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
    label: 'Package',
    render: (value: unknown) => {
      const pkg = value ? getPackageById(value as string) : null;
      return pkg ? <Badge variant="info" size="sm">
            {pkg.name}
          </Badge> : <span className="text-xs sm:text-sm text-gray-400">Not assigned</span>;
    }
  }, {
    key: 'instructorId',
    label: 'Instructor',
    hideOnMobile: true,
    render: (value: unknown) => {
      const instructor = instructors.find(i => i.id === value);
      return instructor ? <span className="text-sm text-gray-700">
            {instructor.name}
          </span> : <span className="text-sm text-gray-400">Not assigned</span>;
    }
  }, {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value: unknown) => <StatusBadge status={value as 'active' | 'inactive'} />
  }];
  const handleRowClick = (candidate: Candidate) => {
    navigate(`/admin/candidates/${candidate.id}`);
  };
  const actions = (candidate: Candidate) => <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/candidates/${candidate.id}`)} icon={<EyeIcon className="w-4 h-4" />} className="hidden sm:flex">
        View
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setEditingCandidate(candidate)} icon={<EditIcon className="w-4 h-4" />}>
        <span className="hidden sm:inline">Edit</span>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setDeletingCandidate(candidate)} 
        icon={<TrashIcon className="w-4 h-4" />}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <span className="hidden sm:inline">Delete</span>
      </Button>
    </div>;
  return <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Candidates
          </h1>
          <p className="text-sm lg:text-base text-gray-500 mt-1">
            Manage driving school candidates ({filteredCandidates.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} icon={<DownloadIcon className="w-4 h-4" />} className="hidden sm:flex">
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />} size="sm" className="flex-1 sm:flex-none">
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, phone, or ID..." />

      {/* Filters */}
      <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <div className="w-full sm:w-48">
          <Select placeholder="All Statuses" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{
          value: '',
          label: 'All Statuses'
        }, {
          value: 'active',
          label: 'Active'
        }, {
          value: 'inactive',
          label: 'Inactive'
        }]} />
        </div>
        <div className="w-full sm:w-48">
          <Select placeholder="All Packages" value={packageFilter} onChange={e => setPackageFilter(e.target.value)} options={[{
          value: '',
          label: 'All Packages'
        }, ...packages.map(pkg => ({
          value: pkg.id,
          label: pkg.name
        }))]} />
        </div>
      </FilterBar>

      {/* Table */}
      <Card padding="none">
        <DataTable data={filteredCandidates} columns={columns} keyExtractor={candidate => candidate.id} searchable={false} onRowClick={handleRowClick} actions={actions} emptyMessage="No candidates found" />
      </Card>

      {/* Add/Edit Modal */}
      <AddCandidateModal instructors={instructors} packages={packages} isOpen={showAddModal || !!editingCandidate} onClose={() => {
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
        title="Delete Candidate"
        message={deletingCandidate ? `Are you sure you want to delete ${deletingCandidate.firstName} ${deletingCandidate.lastName}? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
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
  instructors: { id: string; name: string }[];
  packages: Package[];
};
function AddCandidateModal({
  isOpen,
  onClose,
  candidate,
  onSuccess,
  instructors,
  packages
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

  // Validation function - returns errors object
  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Basic phone validation (at least 6 digits)
      const phoneRegex = /^[\d\s\-\+\(\)]{6,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.dateOfBirth = 'Date of birth must be in the past';
      }
      // Check if age is reasonable (at least 16 years old for driving school)
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      if (actualAge < 16) {
        newErrors.dateOfBirth = 'Candidate must be at least 16 years old';
      }
    }
    
    if (!formData.personalNumber.trim()) {
      newErrors.personalNumber = 'Personal number is required';
    } else if (formData.personalNumber.trim().length < 6) {
      newErrors.personalNumber = 'Personal number must be at least 6 characters';
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
          firstName: 'First name',
          lastName: 'Last name',
          email: 'Email',
          phone: 'Phone number',
          address: 'Address',
          dateOfBirth: 'Date of birth',
          personalNumber: 'Personal number'
        };
        const fieldLabel = fieldLabels[field] || field;
        return `${fieldLabel}: ${validationErrors[field]}`;
      }
    }
    
    // Fallback to first error if not in order
    const firstKey = errorKeys[0];
    const fieldLabels: Record<string, string> = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number',
      address: 'Address',
      dateOfBirth: 'Date of birth',
      personalNumber: 'Personal number'
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
        toast('error', 'Please fix the errors in the form');
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
        const errorMessage = (resp.data as any)?.message || 'Failed to save candidate';
        console.error('API Error Response:', resp.data);
        toast('error', errorMessage);
        return;
      }
      toast('success', candidate ? 'Candidate updated successfully' : 'Candidate added successfully');
      
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
      toast('error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={candidate ? 'Edit Candidate' : 'Add New Candidate'} description="Enter the candidate's information to register them in the system." size="lg"       footer={<div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth className="sm:w-auto">
            Cancel
          </Button>
          <Button onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)} loading={loading} fullWidth className="sm:w-auto">
            {candidate ? 'Save Changes' : 'Create Candidate'}
          </Button>
        </div>}>
      <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="First Name" 
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
            label="Last Name" 
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
            label="Email" 
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
            label="Phone" 
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
            label="Date of Birth" 
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
            label="Personal Number" 
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
          label="Address" 
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
          <Select label="Package" value={formData.packageId} onChange={e => setFormData({
          ...formData,
          packageId: e.target.value
        })} options={packages.filter((p: Package) => p.status === 'active').map((pkg: Package) => ({
          value: pkg.id,
          label: `${pkg.name} - €${pkg.price}`
        }))} />
          <Select label="Instructor" value={formData.instructorId} onChange={e => setFormData({
          ...formData,
          instructorId: e.target.value
        })} options={instructors.map(instructor => ({
          value: instructor.id,
          label: instructor.name
        }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Car" value={formData.carId} onChange={e => setFormData({
          ...formData,
          carId: e.target.value
        })} options={mockCars.filter(c => c.status === 'active').map(car => ({
          value: car.id,
          label: `${car.model} (${car.licensePlate})`
        }))} />
          <Select label="Payment Frequency" value={formData.paymentFrequency} onChange={e => setFormData({
          ...formData,
          paymentFrequency: e.target.value
        })} options={[{
          value: 'deposit',
          label: 'Deposit'
        }, {
          value: 'one-time',
          label: 'One-time Payment'
        }, {
          value: 'installments',
          label: 'Installments'
        }]} />
        </div>

        {candidate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select 
              label="Status" 
              value={formData.status} 
              onChange={e => setFormData({
                ...formData,
                status: e.target.value as 'active' | 'inactive'
              })} 
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]} 
            />
          </div>
        )}
      </form>
    </Modal>;
}