import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, DownloadIcon, EditIcon, TrashIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Payment, Candidate, Package } from '../../types';
import { toast } from '../../hooks/useToast';
import { api } from '../../utils/api';

type PaymentRow = {
  id: string;
  candidateId: string | { _id: string; firstName: string; lastName: string; uniqueClientNumber?: string };
  packageId?: string | { _id: string; name: string; price: number } | null;
  amount: number;
  method: 'bank' | 'cash';
  date: string;
  notes?: string;
  createdAt: string;
};

export function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch payments, candidates, and packages from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, candidatesRes, packagesRes] = await Promise.all([
          api.listPayments(),
          api.listCandidates(),
          api.listPackages(),
        ]);

        if (paymentsRes.ok && paymentsRes.data) {
          // Transform MongoDB data to frontend format
          const mapped = (paymentsRes.data as any[]).map((item) => ({
            id: item._id || item.id,
            candidateId: item.candidateId || '',
            packageId: item.packageId || null,
            amount: item.amount || 0,
            method: item.method || 'cash',
            date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
            notes: item.notes || '',
            createdAt: item.createdAt
              ? new Date(item.createdAt).toISOString().split('T')[0]
              : '',
          }));
          setPayments(mapped);
        } else {
          toast('error', 'Failed to load payments');
        }

        if (candidatesRes.ok && candidatesRes.data) {
          // Transform candidates data
          const mappedCandidates = (candidatesRes.data as any[]).map((item) => ({
            id: item._id || item.id,
            firstName: item.firstName || '',
            lastName: item.lastName || '',
            email: item.email || '',
            phone: item.phone || '',
            dateOfBirth: item.dateOfBirth || '',
            personalNumber: item.personalNumber || '',
            address: item.address || '',
            packageId: item.packageId || '',
            carId: item.carId || '',
            paymentFrequency: item.paymentFrequency || '',
            status: item.status || 'active',
            instructorId: item.instructor?._id || item.instructor || item.instructorId || '',
            uniqueClientNumber: item.uniqueClientNumber || '',
          }));
          setCandidates(mappedCandidates as Candidate[]);
        }

        if (packagesRes.ok && packagesRes.data) {
          // Transform packages data
          const mappedPackages = (packagesRes.data as any[]).map((item) => ({
            id: item._id || item.id,
            name: item.name || '',
            category: item.category || '',
            numberOfHours: item.numberOfHours || 0,
            price: item.price || 0,
            description: item.description || '',
            status: item.status || 'active',
            createdAt: item.createdAt || '',
            updatedAt: item.updatedAt || '',
          }));
          setPackages(mappedPackages as Package[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast('error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  // Helper function to get candidate info
  const getCandidateInfo = (candidateId: string | { _id: string; firstName: string; lastName: string; uniqueClientNumber?: string }) => {
    if (typeof candidateId === 'object' && candidateId !== null) {
      return candidateId;
    }
    return candidates.find((c) => c.id === candidateId);
  };

  // Helper function to get package info from API data
  const getPackageInfo = (packageId: string | { _id: string; name: string; price: number } | null | undefined) => {
    if (!packageId) return null;
    // If it's already an object (populated), use it
    if (typeof packageId === 'object' && packageId !== null && 'name' in packageId) {
      return packageId;
    }
    // Otherwise, get from packages state (from API)
    if (typeof packageId === 'string') {
      return packages.find((pkg) => pkg.id === packageId) || null;
    }
    return null;
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Method filter
      if (methodFilter && payment.method !== methodFilter) return false;
      
      // Date filters
      if (dateFrom && payment.date < dateFrom) return false;
      if (dateTo && payment.date > dateTo) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const candidate = getCandidateInfo(payment.candidateId);
        const candidateName = candidate && typeof candidate === 'object' && 'firstName' in candidate
          ? `${candidate.firstName} ${candidate.lastName}`.toLowerCase()
          : '';
        const candidateNumber = candidate && typeof candidate === 'object' && 'uniqueClientNumber' in candidate
          ? (candidate.uniqueClientNumber || '').toLowerCase()
          : '';
        const pkg = getPackageInfo(payment.packageId);
        const packageName = pkg ? pkg.name.toLowerCase() : '';
        const amount = payment.amount.toString();
        const method = payment.method.toLowerCase();
        const notes = (payment.notes || '').toLowerCase();
        
        const matchesSearch = 
          candidateName.includes(query) ||
          candidateNumber.includes(query) ||
          packageName.includes(query) ||
          amount.includes(query) ||
          method.includes(query) ||
          notes.includes(query);
        
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [payments, methodFilter, dateFrom, dateTo, searchQuery, candidates]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  // Handle edit payment
  const handleEdit = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setShowEditModal(true);
  };

  // Handle delete payment
  const handleDelete = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedPayment) return;
    
    try {
      const { ok, data } = await api.deletePayment(selectedPayment.id);
      if (ok) {
        toast('success', 'Payment deleted successfully');
        setRefreshKey((prev) => prev + 1);
        setShowDeleteModal(false);
        setSelectedPayment(null);
      } else {
        toast('error', (data as any)?.message || 'Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast('error', 'Failed to delete payment');
    }
  };

  // Handle export
  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Candidate Name', 'Client Number', 'Package', 'Amount', 'Method', 'Notes'];
    const rows = filteredPayments.map((payment) => {
      const candidate = getCandidateInfo(payment.candidateId);
      const candidateName = candidate && typeof candidate === 'object' && 'firstName' in candidate
        ? `${candidate.firstName} ${candidate.lastName}`
        : 'Unknown';
      const candidateNumber = candidate && typeof candidate === 'object' && 'uniqueClientNumber' in candidate
        ? (candidate.uniqueClientNumber || '')
        : '';
      const pkg = getPackageInfo(payment.packageId);
      const packageName = pkg ? pkg.name : '-';
      
      return [
        payment.date,
        candidateName,
        candidateNumber,
        packageName,
        payment.amount.toString(),
        payment.method.charAt(0).toUpperCase() + payment.method.slice(1),
        (payment.notes || '').replace(/"/g, '""'), // Escape quotes in CSV
      ];
    });

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast('success', 'Payments exported successfully');
  };

  // Clear all filters
  const clearAllFilters = () => {
    setMethodFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
    },
    {
      key: 'candidateId',
      label: 'Candidate',
      render: (value: unknown) => {
        const candidate = getCandidateInfo(value as any);
        if (typeof candidate === 'object' && candidate !== null && 'firstName' in candidate) {
          return (
            <div>
              <p className="font-medium text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {candidate.uniqueClientNumber || ''}
              </p>
            </div>
          );
        }
        return <span className="text-gray-400">Unknown</span>;
      },
    },
    {
      key: 'packageId',
      label: 'Package',
      render: (value: unknown) => {
        const pkg = getPackageInfo(value as any);
        return pkg ? (
          <Badge variant="info">{pkg.name}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">€{(value as number).toLocaleString()}</span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (value: unknown) => (
        <Badge variant={value === 'bank' ? 'info' : 'default'}>
          {(value as string).charAt(0).toUpperCase() + (value as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value: unknown) => (
        <span className="text-gray-500 truncate max-w-[200px] block">
          {(value as string) || '-'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">
            Track and manage all payment transactions.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            icon={<DownloadIcon className="w-4 h-4" />}
            onClick={handleExport}
            disabled={filteredPayments.length === 0}
          >
            Export
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Total Collected (filtered)</p>
            <p className="text-4xl font-bold mt-1">
              €{totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100">Transactions</p>
            <p className="text-4xl font-bold mt-1">{filteredPayments.length}</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card padding="sm">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Search"
                placeholder="Search by candidate, package, amount, method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                label="Payment Method"
                placeholder="All Methods"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Methods' },
                  { value: 'bank', label: 'Bank Transfer' },
                  { value: 'cash', label: 'Cash' },
                ]}
              />
            </div>
            <div className="w-40">
              <Input
                label="From Date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Input
                label="To Date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {(methodFilter || dateFrom || dateTo || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredPayments}
          columns={columns}
          keyExtractor={(payment) => payment.id}
          searchable={false}
          emptyMessage="No payments found"
          actions={(payment) => (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(payment);
                }}
                icon={<EditIcon className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(payment);
                }}
                icon={<TrashIcon className="w-4 h-4" />}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          )}
        />
      </Card>

      {/* Add Modal */}
      <AddPaymentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          toast('success', 'Payment recorded successfully');
          setShowAddModal(false);
        }}
        candidates={candidates}
        packages={packages}
      />

      {/* Edit Modal */}
      <EditPaymentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPayment(null);
        }}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          toast('success', 'Payment updated successfully');
          setShowEditModal(false);
          setSelectedPayment(null);
        }}
        candidates={candidates}
        packages={packages}
        payment={selectedPayment}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPayment(null);
        }}
        onConfirm={confirmDelete}
        payment={selectedPayment}
      />
    </div>
  );
}

type AddPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidates: Candidate[];
  packages: Package[];
};

function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  candidates,
  packages,
}: AddPaymentModalProps) {
  const [formData, setFormData] = useState({
    candidateId: '',
    amount: '',
    method: '',
    date: new Date().toISOString().split('T')[0],
    packageId: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        candidateId: '',
        amount: '',
        method: '',
        date: new Date().toISOString().split('T')[0],
        packageId: '',
        notes: '',
      });
    }
  }, [isOpen]);

  const selectedCandidate = formData.candidateId
    ? candidates.find((c) => c.id === formData.candidateId)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.candidateId) {
      toast('error', 'Please select a candidate');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast('error', 'Please enter a valid amount');
      return;
    }
    if (!formData.method) {
      toast('error', 'Please select a payment method');
      return;
    }
    if (!formData.date) {
      toast('error', 'Please select a date');
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        candidateId: formData.candidateId,
        amount: parseFloat(formData.amount),
        method: formData.method as 'bank' | 'cash',
        date: formData.date,
        packageId: formData.packageId || selectedCandidate?.packageId || null,
        notes: formData.notes || '',
      };

      console.log('Creating payment with data:', paymentData);

      const { ok, data, status } = await api.createPayment(paymentData);
      
      if (ok) {
        console.log('Payment created successfully:', data);
        onSuccess();
      } else {
        console.error('Failed to create payment:', { status, data });
        const errorMessage = (data as any)?.message || `Failed to record payment (Status: ${status})`;
        toast('error', errorMessage);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast('error', 'Failed to record payment. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      description="Enter the payment details to record a new transaction."
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Record Payment
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Select
          label="Candidate"
          required
          value={formData.candidateId}
          onChange={(e) => {
            const candidate = candidates.find((c) => c.id === e.target.value);
            setFormData({
              ...formData,
              candidateId: e.target.value,
              packageId: candidate?.packageId || '', // Auto-set package from candidate
            });
          }}
          options={candidates.map((candidate) => ({
            value: candidate.id,
            label: `${candidate.firstName} ${candidate.lastName} ${
              candidate.uniqueClientNumber ? `(${candidate.uniqueClientNumber})` : ''
            }`,
          }))}
        />

        {selectedCandidate && selectedCandidate.packageId && (() => {
          const packageInfo = packages.find((pkg) => pkg.id === selectedCandidate.packageId);
          return packageInfo ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Candidate's Package
                  </p>
                  <p className="text-lg font-semibold text-blue-900 mt-1">
                    {packageInfo.name}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {packageInfo.numberOfHours} hours • €{packageInfo.price.toLocaleString()}
                  </p>
                </div>
                <Badge variant="info">{packageInfo.category}</Badge>
              </div>
            </div>
          ) : selectedCandidate.packageId ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Package ID: {selectedCandidate.packageId} (not found in system)
              </p>
            </div>
          ) : null;
        })()}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount"
            type="number"
            required
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: e.target.value,
              })
            }
            placeholder="0.00"
          />
          <Input
            label="Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) =>
              setFormData({
                ...formData,
                date: e.target.value,
              })
            }
          />
        </div>

        <Select
          label="Payment Method"
          required
          value={formData.method}
          onChange={(e) =>
            setFormData({
              ...formData,
              method: e.target.value,
            })
          }
          options={[
            { value: 'bank', label: 'Bank Transfer' },
            { value: 'cash', label: 'Cash' },
          ]}
        />


        <TextArea
          label="Notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData({
              ...formData,
              notes: e.target.value,
            })
          }
          placeholder="Optional notes about this payment..."
          rows={3}
        />
      </form>
    </Modal>
  );
}

type EditPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidates: Candidate[];
  packages: Package[];
  payment: PaymentRow | null;
};

function EditPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  candidates,
  packages,
  payment,
}: EditPaymentModalProps) {
  const [formData, setFormData] = useState({
    candidateId: '',
    amount: '',
    method: '',
    date: new Date().toISOString().split('T')[0],
    packageId: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  // Populate form when payment is provided
  useEffect(() => {
    if (payment && isOpen) {
      const candidateId = typeof payment.candidateId === 'object' && payment.candidateId !== null && '_id' in payment.candidateId
        ? payment.candidateId._id
        : typeof payment.candidateId === 'string'
        ? payment.candidateId
        : '';
      
      setFormData({
        candidateId,
        amount: payment.amount.toString(),
        method: payment.method,
        date: payment.date,
        packageId: typeof payment.packageId === 'string' ? payment.packageId : '',
        notes: payment.notes || '',
      });
    }
  }, [payment, isOpen]);

  const selectedCandidate = formData.candidateId
    ? candidates.find((c) => c.id === formData.candidateId)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    
    setLoading(true);
    try {
      const paymentData = {
        amount: parseFloat(formData.amount),
        method: formData.method as 'bank' | 'cash',
        date: formData.date,
        packageId: formData.packageId || null,
        notes: formData.notes || '',
      };

      const { ok, data } = await api.updatePayment(payment.id, paymentData);
      if (ok) {
        onSuccess();
      } else {
        toast('error', (data as any)?.message || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast('error', 'Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Payment"
      description="Update the payment details."
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Update Payment
          </Button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            Candidate:{' '}
            <span className="font-medium text-gray-900">
              {selectedCandidate 
                ? `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
                : 'Unknown'}
            </span>
          </p>
        </div>

        {selectedCandidate && selectedCandidate.packageId && (() => {
          const packageInfo = packages.find((pkg) => pkg.id === selectedCandidate.packageId);
          return packageInfo ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Candidate's Package
                  </p>
                  <p className="text-lg font-semibold text-blue-900 mt-1">
                    {packageInfo.name}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {packageInfo.numberOfHours} hours • €{packageInfo.price.toLocaleString()}
                  </p>
                </div>
                <Badge variant="info">{packageInfo.category}</Badge>
              </div>
            </div>
          ) : selectedCandidate.packageId ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Package ID: {selectedCandidate.packageId} (not found in system)
              </p>
            </div>
          ) : null;
        })()}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount"
            type="number"
            required
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: e.target.value,
              })
            }
            placeholder="0.00"
          />
          <Input
            label="Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) =>
              setFormData({
                ...formData,
                date: e.target.value,
              })
            }
          />
        </div>

        <Select
          label="Payment Method"
          required
          value={formData.method}
          onChange={(e) =>
            setFormData({
              ...formData,
              method: e.target.value,
            })
          }
          options={[
            { value: 'bank', label: 'Bank Transfer' },
            { value: 'cash', label: 'Cash' },
          ]}
        />

        <TextArea
          label="Notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData({
              ...formData,
              notes: e.target.value,
            })
          }
          placeholder="Optional notes about this payment..."
          rows={3}
        />
      </form>
    </Modal>
  );
}

type DeleteConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payment: PaymentRow | null;
};

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  payment,
}: DeleteConfirmationModalProps) {
  const getCandidateInfo = (candidateId: string | { _id: string; firstName: string; lastName: string; uniqueClientNumber?: string }) => {
    if (typeof candidateId === 'object' && candidateId !== null) {
      return candidateId;
    }
    return null;
  };

  if (!payment) return null;

  const candidate = getCandidateInfo(payment.candidateId);
  const candidateName = candidate && 'firstName' in candidate
    ? `${candidate.firstName} ${candidate.lastName}`
    : 'Unknown';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Payment"
      description="Are you sure you want to delete this payment? This action cannot be undone."
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">Warning: This action cannot be undone.</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Candidate:</span> {candidateName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Amount:</span> €{payment.amount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Date:</span> {new Date(payment.date).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Method:</span> {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
          </p>
        </div>
      </div>
    </Modal>
  );
}
