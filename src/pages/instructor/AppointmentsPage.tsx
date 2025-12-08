import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, EditIcon, XIcon, CheckIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { useAuth } from '../../hooks/useAuth';
import { mockAppointments, mockCandidates, mockCars, getCandidateById, getCarById, getAppointmentsByInstructor, getCandidatesByInstructor, addAppointment, updateAppointment, deleteAppointment } from '../../utils/mockData';
import type { Appointment } from '../../types';
import { toast } from '../../hooks/useToast';
import { ConfirmModal } from '../../components/ui/Modal';
export function AppointmentsPage() {
  const {
    user
  } = useAuth();
  const instructorId = user?.id || '2';
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const myAppointments = getAppointmentsByInstructor(instructorId);
  const myCandidates = getCandidatesByInstructor(instructorId);
  const filteredAppointments = useMemo(() => {
    return myAppointments.filter(a => !statusFilter || a.status === statusFilter).sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [myAppointments, statusFilter]);
  const columns = [{
    key: 'date',
    label: 'Date & Time',
    sortable: true,
    render: (_: unknown, appointment: Appointment) => <div>
          <p className="font-medium text-gray-900">{appointment.date}</p>
          <p className="text-sm text-gray-500">
            {appointment.startTime} - {appointment.endTime}
          </p>
        </div>
  }, {
    key: 'candidateId',
    label: 'Student',
    render: (value: unknown) => {
      const candidate = getCandidateById(value as string);
      return candidate ? <div className="flex items-center gap-3">
            <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="sm" />
            <div>
              <p className="font-medium text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </p>
              <p className="text-sm text-gray-500">{candidate.phone}</p>
            </div>
          </div> : <span className="text-gray-400">Unknown</span>;
    }
  }, {
    key: 'carId',
    label: 'Vehicle',
    render: (value: unknown) => {
      const car = getCarById(value as string);
      return car ? <div>
            <p className="text-gray-900">{car.model}</p>
            <p className="text-sm text-gray-500 font-mono">
              {car.licensePlate}
            </p>
          </div> : <span className="text-gray-400">-</span>;
    }
  }, {
    key: 'hours',
    label: 'Duration',
    render: (value: unknown) => <span className="font-semibold text-gray-900">{value as number}h</span>
  }, {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value: unknown) => {
      const status = value as string;
      const variants: Record<string, 'success' | 'warning' | 'danger'> = {
        completed: 'success',
        scheduled: 'warning',
        cancelled: 'danger'
      };
      return <Badge variant={variants[status]} dot>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>;
    }
  }];
  const handleComplete = (appointment: Appointment) => {
    updateAppointment(appointment.id, {
      status: 'completed'
    });
    setRefreshKey(prev => prev + 1);
    toast('success', 'Appointment marked as completed');
  };
  const handleCancel = () => {
    if (cancellingAppointment) {
      updateAppointment(cancellingAppointment.id, {
        status: 'cancelled'
      });
      setRefreshKey(prev => prev + 1);
      toast('success', 'Appointment cancelled');
      setCancellingAppointment(null);
    }
  };
  const actions = (appointment: Appointment) => <div className="flex items-center gap-2">
      {appointment.status === 'scheduled' && <>
          <Button variant="ghost" size="sm" onClick={() => handleComplete(appointment)} icon={<CheckIcon className="w-4 h-4 text-green-600" />} title="Mark as completed">
            Complete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditingAppointment(appointment)} icon={<EditIcon className="w-4 h-4" />}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCancellingAppointment(appointment)} icon={<XIcon className="w-4 h-4 text-red-600" />} title="Cancel appointment">
            Cancel
          </Button>
        </>}
    </div>;
  return <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">
            Manage your driving lessons and schedule.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<PlusIcon className="w-4 h-4" />}>
          New Appointment
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="w-48">
            <Select placeholder="All Statuses" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{
            value: '',
            label: 'All Statuses'
          }, {
            value: 'scheduled',
            label: 'Scheduled'
          }, {
            value: 'completed',
            label: 'Completed'
          }, {
            value: 'cancelled',
            label: 'Cancelled'
          }]} />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable data={filteredAppointments} columns={columns} keyExtractor={appointment => appointment.id} searchable searchPlaceholder="Search appointments..." searchKeys={['notes']} actions={actions} emptyMessage="No appointments found" />
      </Card>

      {/* Add/Edit Modal */}
      <AddAppointmentModal isOpen={showAddModal || !!editingAppointment} onClose={() => {
      setShowAddModal(false);
      setEditingAppointment(null);
    }} appointment={editingAppointment} candidates={myCandidates} instructorId={instructorId} onSuccess={() => {
      setRefreshKey(prev => prev + 1);
      toast('success', editingAppointment ? 'Appointment updated successfully' : 'Appointment scheduled successfully');
      setShowAddModal(false);
      setEditingAppointment(null);
    }} />

      {/* Cancel Confirmation */}
      <ConfirmModal isOpen={!!cancellingAppointment} onClose={() => setCancellingAppointment(null)} onConfirm={handleCancel} title="Cancel Appointment" message="Are you sure you want to cancel this appointment? This action cannot be undone." confirmText="Cancel Appointment" variant="danger" />
    </div>;
}
type AddAppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  candidates: typeof mockCandidates;
  instructorId: string;
  onSuccess: () => void;
};
function AddAppointmentModal({
  isOpen,
  onClose,
  appointment,
  candidates,
  instructorId,
  onSuccess
}: AddAppointmentModalProps) {
  const [formData, setFormData] = useState({
    candidateId: '',
    carId: '',
    date: '',
    startTime: '',
    endTime: '',
    hours: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  // Get cars assigned to this instructor
  const availableCars = mockCars.filter(c => c.status === 'active');
  useEffect(() => {
    if (appointment) {
      setFormData({
        candidateId: appointment.candidateId,
        carId: appointment.carId,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        hours: appointment.hours.toString(),
        notes: appointment.notes || ''
      });
    } else {
      setFormData({
        candidateId: '',
        carId: '',
        date: '',
        startTime: '',
        endTime: '',
        hours: '',
        notes: ''
      });
    }
  }, [appointment]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const appointmentData = {
        instructorId,
        candidateId: formData.candidateId,
        carId: formData.carId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hours: parseFloat(formData.hours),
        notes: formData.notes,
        status: 'scheduled' as const
      };
      if (appointment) {
        updateAppointment(appointment.id, appointmentData);
      } else {
        addAppointment(appointmentData);
      }
      onSuccess();
    } catch (error) {
      toast('error', 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };
  // Calculate hours when times change
  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return '';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const hours = endH + endM / 60 - (startH + startM / 60);
    return hours > 0 ? hours.toString() : '';
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={appointment ? 'Edit Appointment' : 'Schedule New Appointment'} description={appointment ? 'Update the appointment details.' : 'Create a new driving lesson appointment.'} size="md" footer={<div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {appointment ? 'Save Changes' : 'Schedule Appointment'}
          </Button>
        </div>}>
      <form className="space-y-6">
        <Select label="Student" required value={formData.candidateId} onChange={e => setFormData({
        ...formData,
        candidateId: e.target.value
      })} options={candidates.filter(c => c.status === 'active').map(candidate => ({
        value: candidate.id,
        label: `${candidate.firstName} ${candidate.lastName}`
      }))} />

        <Select label="Vehicle" required value={formData.carId} onChange={e => setFormData({
        ...formData,
        carId: e.target.value
      })} options={availableCars.map(car => ({
        value: car.id,
        label: `${car.model} (${car.licensePlate}) - ${car.transmission}`
      }))} />

        <Input label="Date" type="date" required value={formData.date} onChange={e => setFormData({
        ...formData,
        date: e.target.value
      })} />

        <div className="grid grid-cols-3 gap-4">
          <Input label="Start Time" type="time" required value={formData.startTime} onChange={e => {
          const newStart = e.target.value;
          setFormData({
            ...formData,
            startTime: newStart,
            hours: calculateHours(newStart, formData.endTime)
          });
        }} />
          <Input label="End Time" type="time" required value={formData.endTime} onChange={e => {
          const newEnd = e.target.value;
          setFormData({
            ...formData,
            endTime: newEnd,
            hours: calculateHours(formData.startTime, newEnd)
          });
        }} />
          <Input label="Hours" type="number" required value={formData.hours} onChange={e => setFormData({
          ...formData,
          hours: e.target.value
        })} hint="Auto-calculated" />
        </div>

        <TextArea label="Notes" value={formData.notes} onChange={e => setFormData({
        ...formData,
        notes: e.target.value
      })} placeholder="Optional notes about this lesson..." rows={3} />
      </form>
    </Modal>;
}