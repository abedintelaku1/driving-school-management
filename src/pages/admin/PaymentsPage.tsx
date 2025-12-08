import React, { useMemo, useState } from 'react';
import { PlusIcon, DownloadIcon, FilterIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { mockPayments, mockCandidates, mockPackages, getCandidateById, getPackageById, addPayment } from '../../utils/mockData';
import type { Payment } from '../../types';
import { toast } from '../../hooks/useToast';
export function PaymentsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const filteredPayments = useMemo(() => {
    return mockPayments.filter(payment => {
      if (methodFilter && payment.method !== methodFilter) return false;
      if (dateFrom && payment.date < dateFrom) return false;
      if (dateTo && payment.date > dateTo) return false;
      return true;
    });
  }, [methodFilter, dateFrom, dateTo]);
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const columns = [{
    key: 'date',
    label: 'Date',
    sortable: true
  }, {
    key: 'candidateId',
    label: 'Candidate',
    render: (value: unknown) => {
      const candidate = getCandidateById(value as string);
      return candidate ? <div>
            <p className="font-medium text-gray-900">
              {candidate.firstName} {candidate.lastName}
            </p>
            <p className="text-sm text-gray-500">
              {candidate.uniqueClientNumber}
            </p>
          </div> : <span className="text-gray-400">Unknown</span>;
    }
  }, {
    key: 'packageId',
    label: 'Package',
    render: (value: unknown) => {
      const pkg = value ? getPackageById(value as string) : null;
      return pkg ? <Badge variant="info">{pkg.name}</Badge> : <span className="text-gray-400">-</span>;
    }
  }, {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    render: (value: unknown) => <span className="font-semibold text-gray-900">${value as number}</span>
  }, {
    key: 'method',
    label: 'Method',
    render: (value: unknown) => <Badge variant={value === 'bank' ? 'info' : 'default'}>
          {(value as string).charAt(0).toUpperCase() + (value as string).slice(1)}
        </Badge>
  }, {
    key: 'notes',
    label: 'Notes',
    render: (value: unknown) => <span className="text-gray-500 truncate max-w-[200px] block">
          {value as string || '-'}
        </span>
  }];
  return <div className="space-y-6">
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
          <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
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
            <Select label="Payment Method" placeholder="All Methods" value={methodFilter} onChange={e => setMethodFilter(e.target.value)} options={[{
            value: '',
            label: 'All Methods'
          }, {
            value: 'bank',
            label: 'Bank Transfer'
          }, {
            value: 'cash',
            label: 'Cash'
          }]} />
          </div>
          <div className="w-40">
            <Input label="From Date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="w-40">
            <Input label="To Date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(methodFilter || dateFrom || dateTo) && <Button variant="ghost" size="sm" onClick={() => {
          setMethodFilter('');
          setDateFrom('');
          setDateTo('');
        }}>
              Clear Filters
            </Button>}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable data={filteredPayments} columns={columns} keyExtractor={payment => payment.id} searchable searchPlaceholder="Search payments..." searchKeys={['notes']} emptyMessage="No payments found" />
      </Card>

      {/* Add Modal */}
      <AddPaymentModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => {
      setRefreshKey(prev => prev + 1);
      toast('success', 'Payment recorded successfully');
      setShowAddModal(false);
    }} />
    </div>;
}
type AddPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};
function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess
}: AddPaymentModalProps) {
  const [formData, setFormData] = useState({
    candidateId: '',
    amount: '',
    method: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const selectedCandidate = formData.candidateId ? getCandidateById(formData.candidateId) : null;
  const selectedPackage = selectedCandidate?.packageId ? getPackageById(selectedCandidate.packageId) : null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      addPayment({
        candidateId: formData.candidateId,
        amount: parseFloat(formData.amount),
        method: formData.method as 'bank' | 'cash',
        date: formData.date,
        packageId: selectedCandidate?.packageId,
        notes: formData.notes
      });
      onSuccess();
    } catch (error) {
      toast('error', 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" description="Enter the payment details to record a new transaction." size="md" footer={<div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Record Payment
          </Button>
        </div>}>
      <form className="space-y-6">
        <Select label="Candidate" required value={formData.candidateId} onChange={e => setFormData({
        ...formData,
        candidateId: e.target.value
      })} options={mockCandidates.map(candidate => ({
        value: candidate.id,
        label: `${candidate.firstName} ${candidate.lastName} (${candidate.uniqueClientNumber})`
      }))} />

        {selectedCandidate && selectedPackage && <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              Package:{' '}
              <span className="font-medium text-gray-900">
                {selectedPackage.name}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Price:{' '}
              <span className="font-medium text-gray-900">
                ${selectedPackage.price}
              </span>
            </p>
          </div>}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Amount" type="number" required value={formData.amount} onChange={e => setFormData({
          ...formData,
          amount: e.target.value
        })} placeholder="0.00" />
          <Input label="Date" type="date" required value={formData.date} onChange={e => setFormData({
          ...formData,
          date: e.target.value
        })} />
        </div>

        <Select label="Payment Method" required value={formData.method} onChange={e => setFormData({
        ...formData,
        method: e.target.value
      })} options={[{
        value: 'bank',
        label: 'Bank Transfer'
      }, {
        value: 'cash',
        label: 'Cash'
      }]} />

        <TextArea label="Notes" value={formData.notes} onChange={e => setFormData({
        ...formData,
        notes: e.target.value
      })} placeholder="Optional notes about this payment..." rows={3} />
      </form>
    </Modal>;
}