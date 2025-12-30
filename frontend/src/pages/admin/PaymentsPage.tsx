import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, DownloadIcon } from 'lucide-react';
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
import { mockPackages, getPackageById } from '../../utils/mockData';

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
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch payments and candidates from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, candidatesRes] = await Promise.all([
          api.listPayments(),
          api.listCandidates(),
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
      } catch (error) {
        console.error('Error fetching data:', error);
        toast('error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (methodFilter && payment.method !== methodFilter) return false;
      if (dateFrom && payment.date < dateFrom) return false;
      if (dateTo && payment.date > dateTo) return false;
      return true;
    });
  }, [payments, methodFilter, dateFrom, dateTo]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  // Helper function to get candidate info
  const getCandidateInfo = (candidateId: string | { _id: string; firstName: string; lastName: string; uniqueClientNumber?: string }) => {
    if (typeof candidateId === 'object' && candidateId !== null) {
      return candidateId;
    }
    return candidates.find((c) => c.id === candidateId);
  };

  // Helper function to get package info from mock data
  const getPackageInfo = (packageId: string | { _id: string; name: string; price: number } | null | undefined) => {
    if (!packageId) return null;
    // If it's already an object (populated), use it
    if (typeof packageId === 'object' && packageId !== null && 'name' in packageId) {
      return packageId;
    }
    // Otherwise, get from mock data
    if (typeof packageId === 'string') {
      return getPackageById(packageId);
    }
    return null;
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
        <span className="font-semibold text-gray-900">${(value as number).toLocaleString()}</span>
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
          <Button variant="outline" icon={<DownloadIcon className="w-4 h-4" />}>
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
              ${totalAmount.toLocaleString()}
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
        <div className="flex flex-wrap gap-4 items-end">
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
          {(methodFilter || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMethodFilter('');
                setDateFrom('');
                setDateTo('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredPayments}
          columns={columns}
          keyExtractor={(payment) => payment.id}
          searchable
          searchPlaceholder="Search payments..."
          searchKeys={['notes']}
          emptyMessage="No payments found"
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
      />
    </div>
  );
}

type AddPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidates: Candidate[];
};

function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  candidates,
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
    setLoading(true);
    try {
      const paymentData = {
        candidateId: formData.candidateId,
        amount: parseFloat(formData.amount),
        method: formData.method as 'bank' | 'cash',
        date: formData.date,
        packageId: formData.packageId || (selectedCandidate?.packageId || null),
        notes: formData.notes || '',
      };

      const { ok, data } = await api.createPayment(paymentData);
      if (ok) {
        onSuccess();
      } else {
        toast('error', (data as any)?.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast('error', 'Failed to record payment');
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
          const packageInfo = getPackageById(selectedCandidate.packageId);
          return packageInfo ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">
                Package:{' '}
                <span className="font-medium text-gray-900">{packageInfo.name}</span>
              </p>
              <p className="text-sm text-gray-500">
                Price:{' '}
                <span className="font-medium text-gray-900">${packageInfo.price}</span>
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
