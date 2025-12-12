import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, EyeIcon, EditIcon, DownloadIcon, MailIcon, PhoneIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FilterBar } from '../../components/ui/FilterBar';
import { SearchBar } from '../../components/ui/SearchBar';
import { mockPackages, mockCars, getPackageById } from '../../utils/mockData';
import type { Candidate } from '../../types';
import { toast } from '../../hooks/useToast';
import { api } from '../../utils/api';
export function CandidatesPage() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [packageFilter, setPackageFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
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
    const fetchCandidates = async () => {
      const { ok, data } = await api.listCandidates();
      if (ok && data) {
        const mapped = (data as any[]).map(item => ({
          id: item._id || item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          phone: item.phone,
          dateOfBirth: item.dateOfBirth,
          personalNumber: item.personalNumber,
          address: item.address,
          packageId: item.packageId || '',
          carId: item.carId || '',
          paymentFrequency: item.paymentFrequency || '',
          status: item.status || 'active',
          instructorId: item.instructor?._id || item.instructor || item.instructorId || '',
          uniqueClientNumber: item.uniqueClientNumber || ''
        }));
        setCandidates(mapped as Candidate[]);
      }
    };
    fetchCandidates();
  }, [refreshKey]);

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
    toast('success', 'Candidate added successfully');
  };
  const handleEditSuccess = () => {
    setRefreshKey(prev => prev + 1);
    toast('success', 'Candidate updated successfully');
  };
  const handleExport = () => {
    if (!filteredCandidates.length) {
      toast('info', 'No candidates to export');
      return;
    }

    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Status'];
    const rows = filteredCandidates.map(c => [
      c.firstName || '',
      c.lastName || '',
      c.email || '',
      c.phone || '',
      c.status || ''
    ]);

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
  const hasActiveFilters = statusFilter || packageFilter || searchQuery;
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
        }, ...mockPackages.map(pkg => ({
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
      <AddCandidateModal instructors={instructors} isOpen={showAddModal || !!editingCandidate} onClose={() => {
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
    </div>;
}
type AddCandidateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  candidate?: Candidate | null;
  onSuccess: () => void;
  instructors: { id: string; name: string }[];
};
function AddCandidateModal({
  isOpen,
  onClose,
  candidate,
  onSuccess,
  instructors
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
  }, [candidate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        instructorId: formData.instructorId || undefined
      };
      const resp = candidate ? await api.updateCandidate(candidate.id, payload) : await api.createCandidate(payload);
      if (!resp.ok) {
        toast('error', (resp.data as any)?.message || 'Failed to save candidate');
        return;
      }
      onSuccess();
    } catch (error) {
      toast('error', 'Failed to save candidate');
    } finally {
      setLoading(false);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={candidate ? 'Edit Candidate' : 'Add New Candidate'} description="Enter the candidate's information to register them in the system." size="lg" footer={<div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth className="sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth className="sm:w-auto">
            {candidate ? 'Save Changes' : 'Create Candidate'}
          </Button>
        </div>}>
      <form className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" required value={formData.firstName} onChange={e => setFormData({
          ...formData,
          firstName: e.target.value
        })} />
          <Input label="Last Name" required value={formData.lastName} onChange={e => setFormData({
          ...formData,
          lastName: e.target.value
        })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({
          ...formData,
          email: e.target.value
        })} />
          <Input label="Phone" type="tel" required value={formData.phone} onChange={e => setFormData({
          ...formData,
          phone: e.target.value
        })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date of Birth" type="date" required value={formData.dateOfBirth} onChange={e => setFormData({
          ...formData,
          dateOfBirth: e.target.value
        })} />
          <Input label="Personal Number" required value={formData.personalNumber} onChange={e => setFormData({
          ...formData,
          personalNumber: e.target.value
        })} />
        </div>

        <Input label="Address" required value={formData.address} onChange={e => setFormData({
        ...formData,
        address: e.target.value
      })} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Package" value={formData.packageId} onChange={e => setFormData({
          ...formData,
          packageId: e.target.value
        })} options={mockPackages.filter(p => p.status === 'active').map(pkg => ({
          value: pkg.id,
          label: `${pkg.name} - $${pkg.price}`
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