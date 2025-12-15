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
import { api } from '../../utils/api';
import { toast } from '../../hooks/useToast';
import { ConfirmModal } from '../../components/ui/Modal';

type Appointment = {
  _id?: string;
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  hours?: number;
  notes?: string;
  status: string;
  candidate?: any;
  candidateId?: string;
  carId?: any;
  instructor?: any;
  instructorId?: string;
};

type Candidate = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status?: string;
};

type Car = {
  _id?: string;
  id?: string;
  model: string;
  licensePlate: string;
  transmission?: string;
  status?: string;
};

export function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [appointmentsRes, candidatesRes, carsRes] = await Promise.all([
          api.listAppointments(),
          api.listCandidates(),
          api.listCars()
        ]);

        if (appointmentsRes.ok && appointmentsRes.data) {
          setAppointments(appointmentsRes.data);
        }
        if (candidatesRes.ok && candidatesRes.data) {
          setCandidates(candidatesRes.data);
        }
        if (carsRes.ok && carsRes.data) {
          setCars(carsRes.data);
        }
      } catch (error) {
        toast('error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(a => !statusFilter || a.status === statusFilter)
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
      .map(apt => ({
        ...apt,
        id: apt._id || apt.id,
        candidateId: apt.candidate?._id || apt.candidate?.id || apt.candidateId,
        carId: apt.carId?._id || apt.carId?.id || apt.carId
      }));
  }, [appointments, statusFilter]);

  const getCandidateById = (id: string) => {
    return candidates.find(c => (c._id || c.id) === id);
  };

  const getCarById = (id: string) => {
    return cars.find(c => (c._id || c.id) === id);
  };

  const refreshAppointments = async () => {
    const res = await api.listAppointments();
    if (res.ok && res.data) {
      setAppointments(res.data);
    }
  };

  const columns = [
    {
      key: 'date',
      label: 'Date & Time',
      sortable: true,
      render: (_: unknown, appointment: Appointment) => (
        <div>
          <p className="font-medium text-gray-900">{appointment.date}</p>
          <p className="text-sm text-gray-500">
            {appointment.startTime} - {appointment.endTime}
          </p>
        </div>
      )
    },
    {
      key: 'candidateId',
      label: 'Student',
      render: (value: unknown) => {
        const candidate = getCandidateById(value as string);
        if (!candidate) return <span className="text-gray-400">Unknown</span>;
        return (
          <div className="flex items-center gap-3">
            <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="sm" />
            <div>
              <p className="font-medium text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </p>
              {candidate.phone && (
                <p className="text-sm text-gray-500">{candidate.phone}</p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'carId',
      label: 'Vehicle',
      render: (value: unknown) => {
        if (!value) return <span className="text-gray-400">-</span>;
        const car = getCarById(value as string);
        if (!car) return <span className="text-gray-400">-</span>;
        return (
          <div>
            <p className="text-gray-900">{car.model}</p>
            <p className="text-sm text-gray-500 font-mono">
              {car.licensePlate}
            </p>
          </div>
        );
      }
    },
    {
      key: 'hours',
      label: 'Duration',
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">
          {value ? `${value}h` : '-'}
        </span>
      )
    },
    {
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
        return (
          <Badge variant={variants[status] || 'outline'} dot>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      }
    }
  ];

  const handleComplete = async (appointment: Appointment) => {
    const id = appointment._id || appointment.id;
    if (!id) return;
    
    const res = await api.updateAppointment(id, { status: 'completed' });
    if (res.ok) {
      await refreshAppointments();
      toast('success', 'Appointment marked as completed');
    } else {
      toast('error', 'Failed to update appointment');
    }
  };

  const handleCancel = async () => {
    if (!cancellingAppointment) return;
    
    const id = cancellingAppointment._id || cancellingAppointment.id;
    if (!id) return;

    const res = await api.updateAppointment(id, { status: 'cancelled' });
    if (res.ok) {
      await refreshAppointments();
      toast('success', 'Appointment cancelled');
      setCancellingAppointment(null);
    } else {
      toast('error', 'Failed to cancel appointment');
    }
  };

  const actions = (appointment: Appointment) => (
    <div className="flex items-center gap-2">
      {appointment.status === 'scheduled' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleComplete(appointment)}
            icon={<CheckIcon className="w-4 h-4 text-green-600" />}
            title="Mark as completed"
          >
            Complete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingAppointment(appointment)}
            icon={<EditIcon className="w-4 h-4" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCancellingAppointment(appointment)}
            icon={<XIcon className="w-4 h-4 text-red-600" />}
            title="Cancel appointment"
          >
            Cancel
          </Button>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <Select
              placeholder="All Statuses"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredAppointments}
          columns={columns}
          keyExtractor={appointment => appointment._id || appointment.id || ''}
          searchable
          searchPlaceholder="Search appointments..."
          searchKeys={['notes']}
          actions={actions}
          emptyMessage="No appointments found"
        />
      </Card>

      {/* Add/Edit Modal */}
      <AddAppointmentModal
        isOpen={showAddModal || !!editingAppointment}
        onClose={() => {
          setShowAddModal(false);
          setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        candidates={candidates}
        cars={cars}
        onSuccess={async () => {
          await refreshAppointments();
          toast('success', editingAppointment ? 'Appointment updated successfully' : 'Appointment scheduled successfully');
          setShowAddModal(false);
          setEditingAppointment(null);
        }}
      />

      {/* Cancel Confirmation */}
      <ConfirmModal
        isOpen={!!cancellingAppointment}
        onClose={() => setCancellingAppointment(null)}
        onConfirm={handleCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Cancel Appointment"
        variant="danger"
      />
    </div>
  );
}

type AddAppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  candidates: Candidate[];
  cars: Car[];
  onSuccess: () => void;
};

function AddAppointmentModal({
  isOpen,
  onClose,
  appointment,
  candidates,
  cars,
  onSuccess
}: AddAppointmentModalProps) {
  const { user } = useAuth();
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

  // Get instructor ID from user
  const [instructorId, setInstructorId] = useState<string | null>(null);

  // Calculate hours when times change
  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return '';
    
    // Parse time strings (format: HH:mm)
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    // Convert to minutes for easier calculation
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    // Handle case where end time is next day (end < start)
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) {
      // End time is next day, add 24 hours
      diffMinutes += 24 * 60;
    }
    
    const hours = diffMinutes / 60;
    return hours > 0 ? hours.toFixed(2) : '';
  };

  useEffect(() => {
    const fetchInstructorId = async () => {
      if (user?.role === 0) { // 0 = admin
        // For admin editing, use the appointment's instructor
        if (appointment) {
          const id = appointment.instructor?._id || appointment.instructor?.id || appointment.instructorId;
          setInstructorId(id || null);
        }
      } else if (user?.role === 1) { // 1 = instructor
        // For instructor, fetch their own instructor profile
        const instructorRes = await api.getInstructorMe();
        if (instructorRes.ok && instructorRes.data) {
          const instructor = instructorRes.data;
          setInstructorId(instructor._id || instructor.id || null);
        }
      }
    };
    if (isOpen) {
      fetchInstructorId();
    }
  }, [isOpen, user, appointment]);

  useEffect(() => {
    if (appointment) {
      const startTime = appointment.startTime || '';
      const endTime = appointment.endTime || '';
      const calculatedHours = startTime && endTime ? calculateHours(startTime, endTime) : (appointment.hours?.toString() || '');
      
      setFormData({
        candidateId: appointment.candidate?._id || appointment.candidate?.id || appointment.candidateId || '',
        carId: appointment.carId?._id || appointment.carId?.id || appointment.carId || '',
        date: appointment.date || '',
        startTime: startTime,
        endTime: endTime,
        hours: calculatedHours,
        notes: appointment.notes || ''
      });
    } else {
      // Reset form when no appointment (creating new)
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        candidateId: '',
        carId: '',
        date: '',
        startTime: '',
        endTime: '',
        hours: '',
        notes: ''
      });
      setInstructorId(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!instructorId) {
        toast('error', 'Unable to determine instructor. Please try again.');
        setLoading(false);
        return;
      }

      const appointmentData = {
        instructorId,
        candidateId: formData.candidateId,
        carId: formData.carId || undefined,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hours: formData.hours ? parseFloat(formData.hours) : undefined,
        notes: formData.notes || undefined,
        status: 'scheduled'
      };

      let res;
      if (appointment) {
        const id = appointment._id || appointment.id;
        if (!id) {
          toast('error', 'Invalid appointment ID');
          setLoading(false);
          return;
        }
        res = await api.updateAppointment(id, appointmentData);
      } else {
        res = await api.createAppointment(appointmentData);
      }

      if (res.ok) {
        // Reset form after successful save
        setFormData({
          candidateId: '',
          carId: '',
          date: '',
          startTime: '',
          endTime: '',
          hours: '',
          notes: ''
        });
        onSuccess();
      } else {
        toast('error', res.data?.message || 'Failed to save appointment');
      }
    } catch (error) {
      toast('error', 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  const activeCandidates = candidates.filter(c => !c.status || c.status === 'active');
  const activeCars = cars.filter(c => !c.status || c.status === 'active');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointment ? 'Edit Appointment' : 'Schedule New Appointment'}
      description={appointment ? 'Update the appointment details.' : 'Create a new driving lesson appointment.'}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {appointment ? 'Save Changes' : 'Schedule Appointment'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6">
        <Select
          label="Student"
          required
          value={formData.candidateId}
          onChange={e => setFormData({ ...formData, candidateId: e.target.value })}
          options={activeCandidates.map(candidate => ({
            value: candidate._id || candidate.id || '',
            label: `${candidate.firstName} ${candidate.lastName}`
          }))}
        />

        <Select
          label="Vehicle"
          required
          value={formData.carId}
          onChange={e => setFormData({ ...formData, carId: e.target.value })}
          options={activeCars.map(car => ({
            value: car._id || car.id || '',
            label: `${car.model} (${car.licensePlate})${car.transmission ? ` - ${car.transmission}` : ''}`
          }))}
        />

        <Input
          label="Date"
          type="date"
          required
          value={formData.date}
          onChange={e => setFormData({ ...formData, date: e.target.value })}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Start Time"
            type="time"
            required
            value={formData.startTime}
            onChange={e => {
              const newStart = e.target.value;
              setFormData({
                ...formData,
                startTime: newStart,
                hours: calculateHours(newStart, formData.endTime)
              });
            }}
          />
          <Input
            label="End Time"
            type="time"
            required
            value={formData.endTime}
            onChange={e => {
              const newEnd = e.target.value;
              setFormData({
                ...formData,
                endTime: newEnd,
                hours: calculateHours(formData.startTime, newEnd)
              });
            }}
          />
          <Input
            label="Hours"
            type="number"
            required
            value={formData.hours}
            onChange={e => setFormData({ ...formData, hours: e.target.value })}
            hint="Auto-calculated"
          />
        </div>

        <TextArea
          label="Notes"
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Optional notes about this lesson..."
          rows={3}
        />
      </form>
    </Modal>
  );
}
