import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, EditIcon, MailIcon, PhoneIcon, MapPinIcon, CalendarIcon, CreditCardIcon, ClockIcon, UserIcon, PackageIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs, TabList, Tab, TabPanel } from '../../components/ui/Tabs';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../utils/api';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import type { Appointment } from '../../types';

type Candidate = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  status?: string;
  uniqueClientNumber?: string;
  instructor?: any;
  instructorId?: string;
  carId?: string;
  packageId?: string;
  personalNumber?: string;
};

type AppointmentEx = Appointment & {
  _id?: string;
  candidate?: any;
  instructor?: any;
  candidateId?: string;
  instructorId?: string;
};

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [appointments, setAppointments] = useState<AppointmentEx[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [packageInfo, setPackageInfo] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [candRes, instRes, paymentsRes] = await Promise.all([
        api.getCandidate(id),
        api.listInstructors(),
        api.getPaymentsByCandidate(id)
      ]);

      if (candRes.ok && candRes.data) {
        const data = candRes.data as any;
        // Format dateOfBirth if it's a Date object
        let dateOfBirth = data.dateOfBirth;
        if (dateOfBirth instanceof Date) {
          dateOfBirth = dateOfBirth.toISOString().split('T')[0];
        } else if (typeof dateOfBirth === 'string' && dateOfBirth.includes('T')) {
          dateOfBirth = dateOfBirth.split('T')[0];
        }
        
        setCandidate({
          ...data,
          id: data._id || data.id,
          dateOfBirth: dateOfBirth || data.dateOfBirth,
          instructorId: data.instructorId?._id || data.instructorId || data.instructor?._id || data.instructor || ''
        } as Candidate);

        // Fetch package if candidate has one
        if (data.packageId) {
          const packageRes = await api.getPackage(data.packageId);
          if (packageRes.ok && packageRes.data) {
            setPackageInfo(packageRes.data);
          }
        }
      }

      if (instRes?.ok && instRes.data) {
        const mapped = (instRes.data as any[]).map(inst => ({
          id: inst._id || inst.id,
          name: `${inst.user?.firstName || ''} ${inst.user?.lastName || ''}`.trim()
        }));
        setInstructors(mapped);
      }

      if (paymentsRes?.ok && paymentsRes.data) {
        const mapped = (paymentsRes.data as any[]).map((item) => ({
          id: item._id || item.id,
          amount: item.amount || 0,
          method: item.method || 'cash',
          date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
          notes: item.notes || '',
        }));
        setPayments(mapped);
      }
    } catch (err) {
      console.error('Failed to load candidate detail', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedHours = useMemo(
    () => appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.hours || 0), 0),
    [appointments]
  );

  const instructorName = useMemo(() => {
    if (candidate?.instructor?.user) {
      return `${candidate.instructor.user.firstName || ''} ${candidate.instructor.user.lastName || ''}`.trim();
    }
    const aptWithInstructor = appointments.find(a => a.instructor?.user);
    if (aptWithInstructor?.instructor?.user) {
      return `${aptWithInstructor.instructor.user.firstName || ''} ${aptWithInstructor.instructor.user.lastName || ''}`.trim();
    }
    return 'Not assigned';
  }, [candidate?.instructor, appointments]);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const packagePrice = packageInfo?.price || 0;
  const balance = packagePrice - totalPaid;
  const balanceText = packageInfo ? `€${Math.abs(balance).toLocaleString()}` : '€0';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500">Loading candidate...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <EmptyState
          title="Candidate not found"
          description="The candidate you're looking for doesn't exist or has been removed."
          action={{
            label: 'Back to Candidates',
            onClick: () => navigate('/admin/candidates')
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/candidates')}
          icon={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Back
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                {candidate.uniqueClientNumber && <p className="text-gray-500">{candidate.uniqueClientNumber}</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={(candidate.status as 'active' | 'inactive') || 'active'} />
                <Button variant="outline" icon={<EditIcon className="w-4 h-4" />} onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 text-gray-600">
                <MailIcon className="w-5 h-5 text-gray-400" />
                <span>{candidate.email || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <span>{candidate.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <span>DOB: {candidate.dateOfBirth || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 md:col-span-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span>{candidate.address || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <PackageIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Package</p>
              <p className="font-semibold text-gray-900">
                {packageInfo ? packageInfo.name : 'Not assigned'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <UserIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Instructor</p>
              <p className="font-semibold text-gray-900">
                {instructorName}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hours Completed</p>
              <p className="font-semibold text-gray-900">{completedHours}h</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <CreditCardIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance</p>
              <p className="font-semibold text-gray-900">{balanceText}</p>
              {packageInfo && balance > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {((totalPaid / packagePrice) * 100).toFixed(1)}% paid
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultTab="appointments">
        <TabList>
          <Tab value="appointments">Appointments</Tab>
          <Tab value="payments">Payments</Tab>
          <Tab value="package">Package</Tab>
        </TabList>

        <TabPanel value="appointments">
          <AppointmentsTab appointments={appointments} />
        </TabPanel>

        <TabPanel value="payments">
          <PaymentsTab 
            candidateId={candidate.id || candidate._id || ''} 
            payments={payments}
            packageInfo={packageInfo}
            onPaymentAdded={loadData}
          />
        </TabPanel>

        <TabPanel value="package">
          <PackageTab />
        </TabPanel>
      </Tabs>

      {candidate && (
        <EditCandidateModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          candidate={candidate}
          instructors={instructors}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

function AppointmentsTab({ appointments }: { appointments: AppointmentEx[] }) {
  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true
    },
    {
      key: 'time',
      label: 'Time',
      render: (_: unknown, appointment: AppointmentEx) => (
        <span>
          {appointment.startTime} - {appointment.endTime}
        </span>
      )
    },
    {
      key: 'hours',
      label: 'Hours'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => {
        const status = value as string;
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
          completed: 'success',
          scheduled: 'warning',
          cancelled: 'danger'
        };
        return (
          <Badge variant={variants[status] || 'outline'} dot>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Badge>
        );
      }
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (value: unknown) => <span className="text-gray-500">{(value as string) || '-'}</span>
    }
  ];
  return (
    <Card padding="none">
      <DataTable
        data={appointments}
        columns={columns}
        keyExtractor={a => a._id || a.id || ''}
        searchable={false}
        emptyMessage="No appointments scheduled"
      />
    </Card>
  );
}

type EditModalProps = {
  open: boolean;
  onClose: () => void;
  candidate: Candidate;
  instructors: { id: string; name: string }[];
  onSaved: () => void;
};

function EditCandidateModal({ open, onClose, candidate, instructors, onSaved }: EditModalProps) {
  const [form, setForm] = useState({
    firstName: candidate.firstName || '',
    lastName: candidate.lastName || '',
    email: candidate.email || '',
    phone: candidate.phone || '',
    dateOfBirth: candidate.dateOfBirth || '',
    personalNumber: candidate.personalNumber || '',
    address: candidate.address || '',
    instructorId: candidate.instructorId || candidate.instructor?._id || candidate.instructor?.id || '',
    status: (candidate.status as 'active' | 'inactive') || 'active'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      firstName: candidate.firstName || '',
      lastName: candidate.lastName || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      dateOfBirth: candidate.dateOfBirth || '',
      personalNumber: candidate.personalNumber || '',
      address: candidate.address || '',
      instructorId: candidate.instructorId || candidate.instructor?._id || candidate.instructor?.id || '',
      status: (candidate.status as 'active' | 'inactive') || 'active'
    });
  }, [candidate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      // Convert empty string to null for instructorId
      if (payload.instructorId === '') {
        payload.instructorId = null;
      }
      const resp = await api.updateCandidate(candidate._id || candidate.id!, payload as any);
      if (!resp.ok) {
        alert((resp.data as any)?.message || 'Failed to update candidate');
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      alert('Failed to update candidate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Edit Candidate"
      description="Update candidate information."
      size="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving} fullWidth className="sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} fullWidth className="sm:w-auto">
            Save Changes
          </Button>
        </div>
      }
    >
      <form
        className="space-y-4 sm:space-y-6"
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last Name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
          <Input label="Personal Number" value={form.personalNumber || ''} onChange={e => setForm({ ...form, personalNumber: e.target.value })} />
        </div>
        <Input label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Instructor"
            value={form.instructorId}
            onChange={e => setForm({ ...form, instructorId: e.target.value })}
            options={[
              { value: '', label: 'Not assigned' },
              ...instructors.map(i => ({ value: i.id, label: i.name || 'Instructor' }))
            ]}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
        </div>
      </form>
    </Modal>
  );
}

function PaymentsTab({ 
  candidateId, 
  payments: paymentsProp, 
  packageInfo: packageInfoProp,
  onPaymentAdded 
}: { 
  candidateId: string;
  payments: any[];
  packageInfo: any;
  onPaymentAdded: () => void;
}) {
  const totalPaid = useMemo(() => {
    return paymentsProp.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [paymentsProp]);

  const packagePrice = packageInfoProp?.price || 0;
  const balance = packagePrice - totalPaid;
  const isFullyPaid = balance <= 0;

  const paymentColumns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: unknown) => (
        <span>{new Date(value as string).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">
          €{(value as number).toLocaleString()}
        </span>
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

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Package Price */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="p-4">
            <p className="text-blue-100 text-sm">Package Price</p>
            <p className="text-3xl font-bold mt-1">
              {packageInfoProp ? `€${packagePrice.toLocaleString()}` : 'No Package'}
            </p>
            {packageInfoProp && (
              <p className="text-blue-100 text-xs mt-1">{packageInfoProp.name}</p>
            )}
          </div>
        </Card>

        {/* Total Paid */}
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="p-4">
            <p className="text-green-100 text-sm">Total Paid</p>
            <p className="text-3xl font-bold mt-1">
              €{totalPaid.toLocaleString()}
            </p>
            <p className="text-green-100 text-xs mt-1">
              {paymentsProp.length} payment{paymentsProp.length !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>

        {/* Balance (Remaining) */}
        <Card className={`bg-gradient-to-r text-white ${
          isFullyPaid 
            ? 'from-green-500 to-green-600' 
            : balance > 0 
            ? 'from-orange-600 to-orange-700' 
            : 'from-red-600 to-red-700'
        }`}>
          <div className="p-4">
            <p className="text-white/90 text-sm">
              {isFullyPaid ? 'Fully Paid' : balance > 0 ? 'Remaining' : 'Overpaid'}
            </p>
            <p className="text-3xl font-bold mt-1">
              €{Math.abs(balance).toLocaleString()}
            </p>
            {!isFullyPaid && balance > 0 && (
              <p className="text-white/90 text-xs mt-1">
                {((totalPaid / packagePrice) * 100).toFixed(1)}% paid
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <Card padding="none">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        </div>
        {paymentsProp.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No payments recorded yet.</p>
          </div>
        ) : (
          <DataTable
            data={paymentsProp}
            columns={paymentColumns}
            keyExtractor={(payment) => payment.id}
            searchable={false}
            emptyMessage="No payments found"
          />
        )}
      </Card>
    </div>
  );
}

function PackageTab() {
  return (
    <Card>
      <div className="p-4 sm:p-6 text-gray-600">No package assigned.</div>
    </Card>
  );
}